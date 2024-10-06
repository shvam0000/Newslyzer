from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from transformers import BartTokenizer, BartForConditionalGeneration, BertTokenizer, pipeline, T5Tokenizer, T5ForConditionalGeneration
from newspaper import Article
import re
import openai
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests
from PIL import Image
import numpy as np
import torch
from transformers import ViTImageProcessor, ViTForImageClassification
from io import BytesIO
import matplotlib.pyplot as plt
from pymongo import MongoClient
import ssl

# Initialize FastAPI app
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,  # Allow cookies to be sent across domains
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

load_dotenv()

# ================== User Router ==================
try:
    # Load MongoDB URI from environment
    client = MongoClient(
        os.getenv('MONGODB_URI'),
        tls=True,  # Use `tls` instead of `ssl`
        tlsAllowInvalidCertificates=True  # This disables certificate verification
    )

    # Access the correct database
    db = client['test']  # Replace 'test' with your actual database name

    # Access the collection (no need to check if collection is None)
    user_collection = db["users"]

    # You can print a success message to confirm connection
    print("Successfully connected to MongoDB and accessed the 'users' collection.")

except Exception as e:
    # Handle connection errors
    print(f"Error connecting to MongoDB: {e}")
    user_collection = None

class User(BaseModel):
    auth0Id: str
    name: str
    email: str
    picture: str
    createdAt: str
    savedArticles: list


# Helper function to serialize MongoDB results
def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "auth0Id": user["auth0Id"],
        "name": user["name"],
        "email": user["email"],
        "picture": user["picture"],
        "createdAt": user["createdAt"],
        "savedArticles": user["savedArticles"],
    }

# # ================== SavedArticle Router ==================
class SavedArticle(BaseModel):
    title: str
    url: str
    content: str

# ================== Summarization Model Setup ==================
summarization_tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")
summarization_model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")

# ================== Sentiment Analysis Model Setup ==================
sentiment_tokenizer = BertTokenizer.from_pretrained("nlptown/bert-base-multilingual-uncased-sentiment")
sentiment_pipeline = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")

# ================== Bias Detection and Fact/Opinion Model Setup ==================
fact_vs_opinion_pipeline = pipeline("text-classification", model="typeform/distilbert-base-uncased-mnli")
bias_pipeline_distilbert = pipeline("text-classification", model="nlptown/bert-base-multilingual-uncased-sentiment")

# ================== FLAN-T5 for Question Answering Setup ==================
flan_tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-large", legacy=False)
flan_model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-large")

# Set OpenAI API key for GPT-4 fallback

openai.api_key = os.getenv('OPENAI_API_KEY')

# ================== Deepfake & Manipulation Detection Model Setup ==================
deepfake_labels = ['Real', 'Fake']
label2id = {label: i for i, label in enumerate(deepfake_labels)}
id2label = {i: label for i, label in enumerate(deepfake_labels)}

# Deepfake detection model
deepfake_model_str = "dima806/deepfake_vs_real_image_detection"
deepfake_processor = ViTImageProcessor.from_pretrained(deepfake_model_str)
deepfake_model = ViTForImageClassification.from_pretrained(deepfake_model_str, num_labels=len(deepfake_labels))
deepfake_model.config.id2label = id2label
deepfake_model.config.label2id = label2id

# General manipulation detection model
manipulation_model_str = "google/vit-base-patch16-224"
manipulation_processor = ViTImageProcessor.from_pretrained(manipulation_model_str)
manipulation_model = ViTForImageClassification.from_pretrained(
    manipulation_model_str,
    num_labels=2,  # 2 classes: manipulated, not manipulated
    ignore_mismatched_sizes=True
)

# ================== Helper Functions ==================

def clean_text(text):
    cleaned_text = re.sub(r'[^A-Za-z0-9\s]+', '', text)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
    return cleaned_text.strip()

async def extract_article_text(url: str):
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not extract article from URL. Error: {e}")

# ================== Summarization Functions ==================

async def summarize_text(text: str, max_length=200, min_length=50):
    inputs = summarization_tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = summarization_model.generate(inputs["input_ids"], num_beams=4, max_length=max_length, min_length=min_length, early_stopping=True)
    return summarization_tokenizer.decode(summary_ids[0], skip_special_tokens=True)

# ================== Sentiment Analysis Functions ==================

def tokenize_and_split_text(text, max_length=512):
    inputs = sentiment_tokenizer(text, return_tensors="pt", truncation=True, max_length=max_length)
    tokens = inputs['input_ids'][0]
    chunk_size = max_length
    chunks = [tokens[i:i + chunk_size] for i in range(0, len(tokens), chunk_size)]
    return chunks

def get_sentiment_from_tokens(tokens):
    text_chunk = sentiment_tokenizer.decode(tokens, skip_special_tokens=True)
    result = sentiment_pipeline(text_chunk)
    label = result[0]['label']
    score = int(label[0])
    return score

# ================== Bias Detection and Fact/Opinion Functions ==================

def classify_fact_vs_opinion(text):
    try:
        result = fact_vs_opinion_pipeline(text, truncation=True, max_length=512)
        label = result[0]['label']
        confidence = result[0]['score']
        return label, confidence
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in fact vs. opinion classification: {e}")

def detect_bias_distilbert(text):
    try:
        result = bias_pipeline_distilbert(text, truncation=True, max_length=512)
        label = result[0]['label']
        confidence = result[0]['score']
        
        if '1 star' in label:
            explanation = "Highly biased"
        elif '2 stars' in label:
            explanation = "Moderately biased"
        elif '3 stars' in label:
            explanation = "Neutral"
        elif '4 stars' in label:
            explanation = "Slightly balanced"
        elif '5 stars' in label:
            explanation = "Balanced and factual"
        else:
            explanation = "Unknown bias level"
        
        return f"{label} ({explanation})", confidence
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in bias detection with DistilBERT: {e}")

def detect_bias_gpt(text):
    if len(text.split()) > 2000:
        text = ' '.join(text.split()[:2000])

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": f"Analyze the bias in this article: {text}"}
            ]
        )
        gpt_bias_analysis = response['choices'][0]['message']['content']
        return gpt_bias_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in GPT-4 bias detection: {e}")

# ================== FLAN-T5 Question Answering Functions ==================

# Generate common questions using GPT-4
def generate_common_questions_gpt4(article_text, max_questions=3):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Generate up to {max_questions} common questions readers might ask after reading this article: {article_text}"}
        ]
    )
    questions = response['choices'][0]['message']['content'].split('\n')
    return [q.strip() for q in questions if q.strip()][:max_questions]

# Answer questions using FLAN-T5 model
def answer_common_questions_flan(article_text, question):
    input_text = f"Based on the article: {article_text[:512]}, answer this question: {question}"
    input_ids = flan_tokenizer.encode(input_text, return_tensors="pt")
    outputs = flan_model.generate(input_ids, max_length=150, num_return_sequences=1)
    answer = flan_tokenizer.decode(outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
    if "I cannot" in answer or "article does not cover" in answer.lower():
        return f"The article does not cover that specifically. However: {answer.strip()}"
    return answer.strip()


# Fallback to GPT-4 for additional Q&A
def answer_with_gpt4(article_text, question):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Answer this question based on the following article: {article_text}\nQuestion: {question}"}
        ]
    )
    return response['choices'][0]['message']['content']


# ================== Image Extraction and Processing Functions ==================

def get_image_url_from_article(article_url):
    try:
        article = Article(article_url)
        article.download()
        article.parse()
        images = article.images
        if images:
            return list(images)[0]
        else:
            return None
    except Exception as e:
        raise ValueError(f"Could not extract article from URL. Error: {e}")

def preprocess_image(image_url, processor):
    try:
        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return processor(images=img_array, return_tensors="pt")
    except Exception as e:
        raise ValueError(f"Error processing image: {e}")

def detect_deepfake(image_tensor):
    with torch.no_grad():
        outputs = deepfake_model(**image_tensor)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        confidence, label_idx = torch.max(predictions, dim=1)
        label = id2label[label_idx.item()]
        confidence = confidence.item() * 100
        return label, confidence

def detect_manipulation(image_tensor):
    with torch.no_grad():
        outputs = manipulation_model(**image_tensor)
        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        confidence, label_idx = torch.max(predictions, dim=1)
        label = "Manipulated" if label_idx.item() == 1 else "Not Manipulated"
        confidence = confidence.item() * 100
        return label, confidence


# ================== NewsAPI Integration ==================
api_key = os.getenv('NEWS_API_KEY')  # Set your NewsAPI key

def extract_main_topic(article_url):
    try:
        article = Article(article_url)
        article.download()
        article.parse()
        return article.title  # Main topic is derived from the title
    except Exception as e:
        raise ValueError(f"Could not extract article from URL. Error: {e}")

def get_topic_articles(query):
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "apiKey": api_key,
        "language": "en",
        "pageSize": 2  # Fetch 2 relevant articles
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        articles = response.json().get('articles', [])
        return [{"title": article['title'], "url": article['url']} for article in articles]
    else:
        print("Failed to fetch articles staying on topic.")
        return []

def get_latest_articles_by_country(country='us'):
    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "country": country,
        "apiKey": api_key,
        "language": "en",
        "pageSize": 2  # Fetch 2 latest articles
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        articles = response.json().get('articles', [])
        return [{"title": article['title'], "url": article['url']} for article in articles]
    else:
        print("Failed to fetch latest articles.")
        return []


# ================== Request Models ==================

class ArticleInput(BaseModel):
    url: str

class QuestionInput(BaseModel):
    url: str
    question: str

# ================== API Endpoints ==================

@app.post("/summarize")
async def summarize_article(input: ArticleInput):
    url = input.url
    try:
        # Extract article text and title
        article = Article(url)
        article.download()
        article.parse()
        article_text = article.text
        article_title = article.title  # Extract the article title
        
        # Clean the text
        cleaned_text = clean_text(article_text)
        
        # Summarize the cleaned text
        summary = await summarize_text(cleaned_text)
        
        return {"title": article_title, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.post("/sentiment")
async def analyze_sentiment(input: ArticleInput):
    url = input.url
    try:
        article_text = await extract_article_text(url)
        cleaned_text = clean_text(article_text)
        tokenized_chunks = tokenize_and_split_text(cleaned_text)
        total_score = 0
        for tokens in tokenized_chunks:
            sentiment_score = get_sentiment_from_tokens(tokens)
            total_score += sentiment_score
        average_sentiment_score = total_score / len(tokenized_chunks)
        return {"average_sentiment_score": round(average_sentiment_score, 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/bias")
async def detect_bias_and_fact_opinion(input: ArticleInput):
    url = input.url
    try:
        article_text = await extract_article_text(url)
        cleaned_text = clean_text(article_text)

        # Classify fact vs. opinion
        fact_opinion_label, fact_opinion_confidence = classify_fact_vs_opinion(cleaned_text)

        # Bias detection using DistilBERT and GPT-4
        distilbert_label, distilbert_confidence = detect_bias_distilbert(cleaned_text)
        gpt_bias_analysis = detect_bias_gpt(cleaned_text)

        return {
            "fact_opinion_label": fact_opinion_label,
            "fact_opinion_confidence": round(fact_opinion_confidence, 2),
            "distilbert_bias_label": distilbert_label,
            "distilbert_bias_confidence": round(distilbert_confidence, 2),
            "gpt_bias_analysis": gpt_bias_analysis
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/question")
async def answer_questions(input: QuestionInput):
    url = input.url
    question = input.question
    try:
        # Extract and clean article text
        article_text = await extract_article_text(url)
        cleaned_text = clean_text(article_text)

        # Answer using FLAN-T5
        answer = answer_common_questions_flan(cleaned_text, question)
        if "article does not cover" in answer.lower():
            answer = answer_with_gpt4(cleaned_text, question)

        return {"question": question, "answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/common-questions")
async def generate_and_answer_questions(input: ArticleInput):
    url = input.url
    try:
        # Extract and clean article text
        article_text = await extract_article_text(url)
        cleaned_text = clean_text(article_text)
        
        # Generate common questions with GPT-4
        questions = generate_common_questions_gpt4(cleaned_text)
        
        # Answer each question using FLAN-T5
        answers = []
        for question in questions:
            answer = answer_common_questions_flan(cleaned_text, question)
            
            if answer:
                answers.append({"question": question, "answer": answer})
            else:
                # FLAN-T5 couldn't answer, ask if user wants to use GPT-4
                answers.append({"question": question, "answer": "FLAN-T5 cannot answer. Would you like to connect to GPT-4 for an answer?"})

        return {"questions_and_answers": answers}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Endpoint to proceed with GPT-4 if user agrees
@app.post("/gpt-answer")
async def proceed_with_gpt(input: ArticleInput, question: str):
    url = input.url
    try:
        # Extract and clean article text
        article_text = await extract_article_text(url)
        cleaned_text = clean_text(article_text)
        
        # Generate answer using GPT-4
        answer = answer_with_gpt4(cleaned_text, question)
        return {"question": question, "answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/detect-image")
async def detect_image_manipulation(input: ArticleInput):
    url = input.url
    try:
        image_url = get_image_url_from_article(url)
        if not image_url:
            raise HTTPException(status_code=404, detail="No image found in the article.")
        
        image_tensor = preprocess_image(image_url, deepfake_processor)

        # Deepfake detection
        deepfake_label, deepfake_confidence = detect_deepfake(image_tensor)

        # Manipulation detection
        manipulation_label, manipulation_confidence = detect_manipulation(image_tensor)

        return {
            "image_url": image_url,
            "deepfake_detection": {
                "label": deepfake_label,
                "confidence": round(deepfake_confidence, 2)
            },
            "manipulation_detection": {
                "label": manipulation_label,
                "confidence": round(manipulation_confidence, 2)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/fetch-news")
async def fetch_news(input: ArticleInput):
    url = input.url
    try:
        # Extract main topic from the article
        main_topic = extract_main_topic(url)
        
        # Fetch articles staying on the topic
        topic_articles = get_topic_articles(main_topic)
        
        # Fetch the latest news articles by country
        latest_articles = get_latest_articles_by_country()
        
        return {
            "main_topic": main_topic,
            "topic_articles": topic_articles,
            "latest_articles": latest_articles
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

def print_entire_db(db):
    for collection_name in db.list_collection_names():
        collection = db[collection_name]
        print(f"\n--- Collection: {collection_name} ---")
        documents = list(collection.find({}))  # Get all documents in the collection
        for doc in documents:
            print(doc)  # Print each document


@app.post("/articles/save")
async def save_article(payload: dict = Body(...)):
    if user_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    print('user_collection:', user_collection)
    # print_entire_db(db)

    auth0Id = payload.get('auth0Id')
    article = payload.get('article')
    print('auth0Id:', auth0Id)
    print('article:', article)

    if not auth0Id or not article:
        raise HTTPException(status_code=422, detail="auth0Id and article are required")

    # Check if user exists
    user = user_collection.find_one({"auth0Id": {"$regex": f"^{auth0Id}$", "$options": "i"}})
    print('user:', user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Append article to user's savedArticles list
    user_collection.update_one(
        {"auth0Id": auth0Id},
        {"$push": {"savedArticles": article}}
    )

    return {"message": "Article saved successfully"}



# ================== Run the app with: uvicorn main:app --reload ==================

