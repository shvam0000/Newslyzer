from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import BartTokenizer, BartForConditionalGeneration, BertTokenizer, pipeline, T5Tokenizer, T5ForConditionalGeneration
from newspaper import Article
import re
import openai
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Initialize FastAPI app
app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers
)

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
load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')

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

# ================== Run the app with: uvicorn main:app --reload ==================
