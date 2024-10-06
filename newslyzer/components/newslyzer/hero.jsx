import { useUser } from '@auth0/nextjs-auth0/client';
import React, { useState, useEffect, useRef } from 'react';
import { Space_Grotesk } from 'next/font/google';
import Button from '../shared/button'; // Assuming you have a shared button component
import axios from 'axios';
import { StarIcon } from '@/utils/icons';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '700'],
  subsets: ['latin'],
});

const NewsLyzerHero = () => {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [title, setTitle] = useState('');
  const [sentiment, setSentiment] = useState();
  const [distilbertBiasConfidence, setDistilbertBiasConfidence] = useState();
  const [distilbertBiasLabel, setDistilbertBiasLabel] = useState();
  const [factOpinionConfidence, setFactOpinionConfidence] = useState();
  const [factOpinionLabel, setFactOpinionLabel] = useState();
  const [gptBiasAnalysis, setGptBiasAnalysis] = useState();
  const [hitsearch, setHitSearch] = useState(false);
  const [userId, setUserId] = useState();
  const [imgUrl, setImgUrl] = useState();
  const [deepfakeDetection, setDeepfakeDetection] = useState({
    label: '',
    confidence: 0,
  });

  const [manipulatedDetection, setManipulatedDetection] = useState({
    label: '',
    confidence: 0,
  });

  const [news, setNews] = useState();

  const handleSearch = (e) => {
    e.preventDefault();
    setHitSearch(true);

    axios
      .post('http://localhost:8000/detect-image', {
        url: url,
      })
      .then((res) => {
        console.log('Img Response:', res.data);
        setImgUrl(res.data.image_url);
        setDeepfakeDetection({
          label: res.data.deepfake_detection.label,
          confidence: res.data.deepfake_detection.confidence,
        });
        setManipulatedDetection({
          label: res.data.manipulation_detection.label,
          confidence: res.data.manipulation_detection.confidence,
        });

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
                    setDistilbertBiasConfidence(
                      res.data.distilbert_bias_confidence
                    );
                    setDistilbertBiasLabel(res.data.distilbert_bias_label);
                    setFactOpinionConfidence(res.data.fact_opinion_confidence);
                    setFactOpinionLabel(res.data.fact_opinion_label);
                    setGptBiasAnalysis(res.data.gpt_bias_analysis);

                    axios
                      .post('http://localhost:8000/fetch-news', {
                        url: url,
                      })
                      .then((res) => {
                        console.log('News:', res.data);
                        setNews(res.data.latest_articles);
                      })
                      .catch((err) => {
                        console.error('Error fetching questions:', err);
                        toast.error(
                          'Error fetching the questions. Please try again.'
                        );
                      });
                  })
                  .catch((err) => {
                    console.error('Error fetching bias:', err);
                    toast.error('Error fetching the bias. Please try again.');
                  });
              })
              .catch((err) => {
                console.error('Error fetching sentiment:', err);
                toast.error('Error fetching the sentiment. Please try again.');
              });
          })
          .catch((err) => {
            console.error('Error fetching summary:', err);
            toast.error('Error fetching the summary. Please try again.');
          });
      })
      .catch((err) => {
        console.error('Error searching:', err);
        toast.error('Error searching for the article. Please try again.');
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

    axios
      .post('http://localhost:8000/articles/save', {
        auth0Id: userId,
        article: {
          title: title,
          url: url,
          content: summary,
        },
      })
      .then((res) => {
        console.log('Save article response:', res.data);
        toast.success('Article saved successfully!');
      })
      .catch((err) => {
        toast.error('Error saving article. Please try again.');
      });
  };

  const useOnScreen = (ref) => {
    const [isIntersecting, setIntersecting] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => setIntersecting(entry.isIntersecting),
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => {
        if (ref.current) {
          observer.unobserve(ref.current); // Make sure ref.current is not null
        }
      };
    }, [ref]);

    return isIntersecting;
  };

  const FadeInSection = ({ children }) => {
    const ref = useRef();
    const isVisible = useOnScreen(ref);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: isVisible ? 1 : 0, translateY: isVisible ? 0 : 50 }}
        transition={{ duration: 0.8 }}>
        {children}
      </motion.div>
    );
  };

  return (
    <div className={` ${spaceGrotesk.className} min-h-screen px-44`}>
      {/* Search Section */}
      <div>
        <Toaster position="bottom-center" reverseOrder={false} />
      </div>
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
        <FadeInSection>
          <div className="mt-8 flex justify-end">
            <button
              className="text-primary-bg text-xl block w-fit px-2 py-1 rounded-lg"
              onClick={handleSaveArticle}>
              <div className="flex justify-center items-center space-x-2">
                <div className="text-primary-bg">
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    stroke-width="0"
                    viewBox="0 0 384 512"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 512V48C0 21.49 21.49 0 48 0h288c26.51 0 48 21.49 48 48v464L192 400 0 512z"></path>
                  </svg>
                </div>
                <span>Save</span>
              </div>
            </button>
          </div>
        </FadeInSection>
      ) : (
        <div></div>
      )}

      {imgUrl && (
        <FadeInSection>
          <div className="mt-8">
            <div>
              <img src={imgUrl} alt="Image URL" className="w-full my-4" />
            </div>
            <div>
              <span className="font-bold">Deepfake Detection Confidence:</span>{' '}
              {deepfakeDetection.confidence}%
            </div>
            <div>
              <span className="font-bold">Deepfake Detection Label:</span>{' '}
              {deepfakeDetection.label}
            </div>
            <div>
              <span className="font-bold">
                Manipulated Detection Confidence:
              </span>{' '}
              {manipulatedDetection.confidence}%
            </div>
            <div>
              <span className="font-bold">Manipulated Detection Label:</span>{' '}
              {manipulatedDetection.label}
            </div>
          </div>
        </FadeInSection>
      )}

      {/* Summary Section */}
      {summary ? (
        <FadeInSection>
          <div className="my-4">
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="mt-4">{summary}</p>
          </div>
        </FadeInSection>
      ) : url && !summary && hitsearch ? (
        <FadeInSection>
          <div className="text-center">Loading Summary...</div>
        </FadeInSection>
      ) : (
        <div></div>
      )}

      {/* Sentiment Section */}
      {sentiment ? (
        <FadeInSection>
          <div>
            <h2 className="text-3xl font-bold my-4">Sentiment Analysis</h2>
            <div className="flex">
              {Array.from({ length: sentiment }, (_, index) => (
                <span key={index} className="text-yellow-400 text-2xl">
                  <StarIcon />
                </span>
              ))}
            </div>
          </div>
        </FadeInSection>
      ) : url && !sentiment && hitsearch ? (
        <FadeInSection>
          <div className="text-center">Loading Sentiment...</div>
        </FadeInSection>
      ) : (
        <div></div>
      )}

      {/* Bias Section */}
      {distilbertBiasConfidence ||
      distilbertBiasLabel ||
      factOpinionConfidence ||
      factOpinionLabel ? (
        <FadeInSection>
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
        </FadeInSection>
      ) : url && !distilbertBiasConfidence && hitsearch ? (
        <FadeInSection>
          <div className="text-center">Loading Bias...</div>
        </FadeInSection>
      ) : (
        <div></div>
      )}

      {news && (
        <FadeInSection>
          <div className="mb-8">
            <h2 className="text-3xl font-bold mt-8">Latest News</h2>
            <div className="grid grid-cols-2 gap-4 my-2">
              {news.map((article, index) => (
                <div key={index} className="w-full p-4 border border-hero-bg">
                  <h3 className="text-xl font-bold">{article.title}</h3>
                  <Link href={article.url} target="_blank" rel="noreferrer">
                    <Button text="Read More" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>
      )}
    </div>
  );
};

export default NewsLyzerHero;
