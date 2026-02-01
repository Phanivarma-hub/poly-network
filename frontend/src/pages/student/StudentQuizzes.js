import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { FileText, CheckCircle, X, Play } from 'lucide-react';

const StudentQuizzes = () => {
    const { userData } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!userData?.college_id || !userData?.class_id) return;

            try {
                // Fetch active quizzes
                const quizQuery = query(
                    collection(db, 'quizzes'),
                    where('college_id', '==', userData.college_id),
                    where('class_id', '==', userData.class_id),
                    where('status', '==', 'active')
                );
                const quizSnapshot = await getDocs(quizQuery);
                setQuizzes(quizSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch student's attempts
                const attemptsMap = {};
                for (const quizDoc of quizSnapshot.docs) {
                    const attemptQuery = query(
                        collection(db, 'quiz_attempts'),
                        where('quiz_id', '==', quizDoc.id),
                        where('student_id', '==', userData.pin)
                    );
                    const attemptSnapshot = await getDocs(attemptQuery);
                    if (!attemptSnapshot.empty) {
                        attemptsMap[quizDoc.id] = attemptSnapshot.docs[0].data();
                    }
                }
                setAttempts(attemptsMap);
            } catch (error) {
                console.error('Error fetching quizzes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData]);

    const startQuiz = async (quiz) => {
        try {
            const questionsQuery = query(
                collection(db, 'quiz_questions'),
                where('quiz_id', '==', quiz.id)
            );
            const snapshot = await getDocs(questionsQuery);
            setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setActiveQuiz(quiz);
            setAnswers({});
            setSubmitted(false);
            setScore(null);
        } catch (error) {
            console.error('Error starting quiz:', error);
        }
    };

    const handleSubmit = async () => {
        let correct = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                correct++;
            }
        });

        const scorePercentage = Math.round((correct / questions.length) * 100);
        setScore(scorePercentage);
        setSubmitted(true);

        try {
            await addDoc(collection(db, 'quiz_attempts'), {
                quiz_id: activeQuiz.id,
                student_id: userData.pin,
                answers: answers,
                score: scorePercentage,
                attempted_at: new Date()
            });

            // Update attempts state
            setAttempts(prev => ({
                ...prev,
                [activeQuiz.id]: { score: scorePercentage }
            }));
        } catch (error) {
            console.error('Error saving attempt:', error);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div>Loading quizzes...</div>;
    }

    if (activeQuiz && !submitted) {
        return (
            <div className="quiz-taking">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">{activeQuiz.title}</h1>
                        <p className="page-description">{activeQuiz.subject} • {questions.length} questions</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setActiveQuiz(null)}>
                        <X size={16} /> Cancel
                    </button>
                </div>

                <div className="quiz-questions">
                    {questions.map((q, idx) => (
                        <div key={q.id} className="card" style={{ marginBottom: '1rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Q{idx + 1}. {q.question}</h4>
                            <div className="quiz-options">
                                {q.options.map((opt, optIdx) => (
                                    <label key={optIdx} className={`quiz-option ${answers[q.id] === optIdx ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name={`question_${q.id}`}
                                            checked={answers[q.id] === optIdx}
                                            onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                                        />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length !== questions.length}
                >
                    <CheckCircle size={16} /> Submit Quiz
                </button>

                <style>{`
                    .quiz-options {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    .quiz-option {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.75rem 1rem;
                        background-color: var(--bg-primary);
                        border: 1px solid var(--border-color);
                        border-radius: var(--border-radius);
                        cursor: pointer;
                        transition: all 0.15s;
                    }
                    .quiz-option:hover {
                        border-color: var(--accent-primary);
                    }
                    .quiz-option.selected {
                        border-color: var(--accent-primary);
                        background-color: rgba(99, 102, 241, 0.1);
                    }
                `}</style>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="quiz-result">
                <div className="card" style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                    <CheckCircle size={48} style={{ color: 'var(--accent-success)', marginBottom: '1rem' }} />
                    <h2>Quiz Completed!</h2>
                    <p style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-primary)', margin: '1rem 0' }}>
                        {score}%
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Your score for {activeQuiz.title}
                    </p>
                    <button className="btn btn-primary" onClick={() => setActiveQuiz(null)}>
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="quizzes-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Quizzes</h1>
                    <p className="page-description">Attempt quizzes assigned to your class.</p>
                </div>
            </div>

            {quizzes.length === 0 ? (
                <div className="empty-state">
                    <FileText size={40} />
                    <p>No active quizzes available.</p>
                </div>
            ) : (
                <div className="quiz-list">
                    {quizzes.map(quiz => (
                        <div key={quiz.id} className="card quiz-card">
                            <div className="quiz-info">
                                <h3 style={{ marginBottom: '0.25rem' }}>{quiz.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{quiz.subject}</p>
                            </div>
                            <div className="quiz-action">
                                {attempts[quiz.id] ? (
                                    <span className="badge badge-success">
                                        <CheckCircle size={12} style={{ marginRight: '4px' }} />
                                        Score: {attempts[quiz.id].score}%
                                    </span>
                                ) : (
                                    <button className="btn btn-primary btn-sm" onClick={() => startQuiz(quiz)}>
                                        <Play size={14} /> Start Quiz
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .quiz-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .quiz-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
            `}</style>
        </div>
    );
};

export default StudentQuizzes;
