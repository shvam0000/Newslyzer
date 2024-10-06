import { useUser } from '@auth0/nextjs-auth0/client';
import React, { useState, useEffect } from 'react';
import { Space_Grotesk } from 'next/font/google';
import Button from '../shared/button'; // Assuming you have a shared button component
import axios from 'axios';
import { StarIcon } from '@/utils/icons';
import { set } from 'mongoose';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const NewsLyzerHero = () => {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [title, setTitle] = useState('');
  const [sentiment, setSentiment] = useState();
  const [bias, setBias] = useState();
  const [distilbertBiasConfidence, setDistilbertBiasConfidence] = useState();
  const [distilbertBiasLabel, setDistilbertBiasLabel] = useState();
  const [factOpinionConfidence, setFactOpinionConfidence] = useState();
  const [factOpinionLabel, setFactOpinionLabel] = useState();
  const [gptBiasAnalysis, setGptBiasAnalysis] = useState();
  const [questions, setQuestions] = useState([]);
  const [hitsearch, setHitSearch] = useState(false);
  const [userId, setUserId] = useState();

  function capitalizeFirstWord(str) {
    if (!str) return '';
    const words = str.split(' ');
    if (words.length === 0) return str;

    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);

    return words.join(' ');
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setHitSearch(true);

    axios
      .post('http://localhost:8000/summarize', {
        url: url,
      })
      .then((res) => {
        console.log('Response:', res.data);
        setTitle(res.data.title);
        setSummary(res.data.summary);
        setHitSearch(false);

        axios
          .post('http://localhost:8000/sentiment', {
            url: url,
          })
          .then((res) => {
            console.log('Sentiment:', res.data);
            setSentiment(res.data.average_sentiment_score);

            axios
              .post('http://localhost:8000/bias', {
                url: url,
              })
              .then((res) => {
                console.log('Bias:', res.data);
                setBias(res.data);
                setDistilbertBiasConfidence(
                  res.data.distilbert_bias_confidence
                );
                setDistilbertBiasLabel(res.data.distilbert_bias_label);
                setFactOpinionConfidence(res.data.fact_opinion_confidence);
                setFactOpinionLabel(res.data.fact_opinion_label);
                setGptBiasAnalysis(res.data.gpt_bias_analysis);
              })
              .catch((err) => {
                console.error('Error fetching bias:', err);
              });
          })
          .catch((err) => {
            console.error('Error fetching sentiment:', err);
          });
      })
      .catch((err) => {
        console.error('Error fetching summary:', err);
      });

    console.log('Search Query:', url);
  };

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setUserId(user.sub);
    }
  }, [user]);

  const handleSaveArticle = () => {
    if (!user || !url || !title || !summary) {
      console.error('Missing required fields to save the article');
      return;
    }

    const data = {
      article: {
        title: title,
        url: url,
        content: summary, // Using the summary as the article content
      },
    };

    axios
      .post('http://localhost:8000/articles/save', {
        auth0Id: userId, // Send auth0Id in the body
        article: {
          title: title,
          url: url,
          content: summary,
        },
      })
      .then((res) => {
        console.log('Save article response:', res.data);
      })
      .catch((err) => {
        console.log(userId);
        console.log('Error saving article:', err);
      });
  };

  return (
    <div className={` ${spaceGrotesk.className} min-h-screen px-44`}>
      {/* Search Section */}
      <div className="flex flex-col flex-wrap items-center mt-20">
        <h1 className={`text-5xl mb-8 font-bold ${spaceGrotesk.className}`}>
          Find the News You Need
        </h1>

        <form
          onSubmit={handleSearch}
          className="flex items-center space-x-4 w-1/2">
          <input
            type="text"
            placeholder="Search for articles, news, or topics..."
            className="w-full p-4 rounded-lg text-black focus:outline-none text-lg border border-primary-bg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            text="Search"
            className="bg-hero-bg text-white px-4 py-2 rounded-lg"
          />
        </form>
      </div>

      {!url && (
        <div className="mt-8 text-center">
          <p className="mt-4">
            Enter a URL in the search bar above to get a summary, sentiment
            analysis, bias analysis, and common questions for the article.
          </p>
        </div>
      )}

      {summary && sentiment && factOpinionLabel ? (
        <div className="mt-8">
          {/* <Button
            text="Save Article"
            className="bg-primary-bg text-white px-4 py-2 rounded-lg"
            onMouseDown={handleSaveArticle}
          /> */}
          <button onClick={handleSaveArticle}>save</button>
        </div>
      ) : (
        <div></div>
      )}

      {/* Summary Section */}
      {summary ? (
        <div className="mt-8">
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="mt-4">{summary}</p>
        </div>
      ) : url && !summary && hitsearch ? (
        <div className="text-center">Loading Summary...</div>
      ) : (
        <div></div>
      )}

      {/* Sentiment Section */}
      {sentiment ? (
        <div>
          <h2 className="text-3xl font-bold mt-4">Sentiment Analysis</h2>
          <div className="flex">
            {Array.from({ length: sentiment }, (_, index) => (
              <span key={index} className="text-yellow-400 text-2xl">
                <StarIcon />
              </span>
            ))}
          </div>
        </div>
      ) : url && !sentiment && hitsearch ? (
        <div className="text-center">Loading Sentiment...</div>
      ) : (
        <div></div>
      )}

      {/* Bias Section */}
      {distilbertBiasConfidence ||
      distilbertBiasLabel ||
      factOpinionConfidence ||
      factOpinionLabel ? (
        <div className="my-8">
          <h2 className="text-3xl font-bold mb-2">Bias Analysis</h2>
          <div>
            <span className="font-bold">DistilBert Bias Confidence:</span>{' '}
            {distilbertBiasConfidence * 100}%
          </div>
          <div>
            <span className="font-bold">DistilBert Bias Label:</span>{' '}
            {distilbertBiasLabel}
          </div>
          <div>
            <span className="font-bold">Fact Opinion Confidence:</span>{' '}
            {Math.floor(factOpinionConfidence * 100)}%
          </div>
          <div>
            <span className="font-bold">Fact Opinion Label:</span>{' '}
            {factOpinionLabel}
          </div>
          <div>
            <span className="font-bold">GPT Bias Analysis:</span>{' '}
            {gptBiasAnalysis}
          </div>
        </div>
      ) : url && !distilbertBiasConfidence && hitsearch ? (
        <div className="text-center">Loading Bias...</div>
      ) : (
        <div></div>
      )}

      {/* {console.log('Questions:', typeof questions)} */}
      {/* FAQ Section */}

      {/* {Array.isArray(questions) && questions.length > 0 ? (
        <div className="my-8">
          <h2 className="text-3xl font-bold">FAQ</h2>
          <div className="mt-4">
            {questions.map((q, index) => (
              <details key={index} className="mb-4">
                <summary className="font-bold cursor-pointer">
                  {capitalizeFirstWord(q.question)}
                </summary>
                <p className="mt-2">{capitalizeFirstWord(q.answer)}</p>
              </details>
            ))}
          </div>
        </div>
      ) : url && !questions && hitsearch ? (
        <p className="text-center">Loading Questions...</p>
      ) : (
        <div></div>
      )} */}
    </div>
  );
};

export default NewsLyzerHero;

// axios
//   .post('http://localhost:8000/common-questions', {
//     url: url,
//   })
//   .then((res) => {
//     console.log('Questions response:', res.data.questions_and_answers);
//     if (Array.isArray(res.data.questions_and_answers)) {
//       setQuestions(res.data.questions_and_answers);
//     } else {
//       console.error('Questions data is not an array:', res.data);
//     }
//   })
//   .catch((err) => {
//     console.error('Error fetching questions:', err);
//   });
