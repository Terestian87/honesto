import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/users.css'
import Rating from './Rating'
import Text from './Text'
import Choice from './Choice'
//functional component

const Users = ({ getStore }) => {
    const [users, setUsers] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [questionNum, setQuestionNum] = useState(0);
    const [chosenId, setChosenId] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [feedbackData, setFeedbackData] = useState({})
    //choice handler
    const [choice, setChoice] = useState(null)

    // componentDidMount functional style
    useEffect(() => {
        fetchUserData()
        fetchQuestions()
    }, [])

    useEffect(() => {
        getStore('feedback', async (store) => {
            let cursor = await store.openCursor();
            const newFeedbacks = {}

            while (cursor) {
                const { key } = cursor
                newFeedbacks[key] = cursor.value
                cursor = await cursor.continue();
            }
            setFeedbackData(newFeedbacks)
        })
    }, [getStore, completed]) // aggiungi completed

    useEffect(() => {
        if (!chosenId) {
            return
        }

        getStore('feedback', async (store) => {
            const currentFeedback = await store.get(chosenId)
            const { answers } = currentFeedback
            if (answers[questionNum] === null) {
                return
            }
            setChoice(answers[questionNum])
        })
    }, [questionNum, chosenId, getStore])

    console.log(feedbackData)

    //Fetch data in asyn
    const fetchUserData = async () => {
        //take data from json in url and store in res const
        const userRes = await fetch('https://frontend-exercise-api.netlify.app/.netlify/functions/server/users')
        //make response usable
        const userData = await userRes.json()
        // call setUser hook to store response (data) in user
        setUsers(userData)
    }

    const fetchQuestions = async () => {
        const questionsRes = await fetch('https://frontend-exercise-api.netlify.app/.netlify/functions/server/questions')
        const questionsData = await questionsRes.json()
        setQuestions(questionsData)
    }

    //conditional rendering on click
    const handleFirstClick = (id) => {
        setChosenId(id)

        getStore('feedback', async store => {
            const currentFeedback = await store.get(id)
            if (!currentFeedback) {
                await store.put({
                    isSubmitted: false,
                    answers: [...Array(questions.length)].map(() => null),
                }, id)
            }
        })
    }

    const handleSetAnswers = (value, index, isSubmitted = false) => {
        getStore('feedback', async (store) => {
            const currentFeedback = await store.get(chosenId)  // data[id]
            const { answers } = currentFeedback
            answers[index] = value
            await store.put({
                isSubmitted,
                answers
            }, chosenId)
        })
        setChoice('')
    }

    const handleNext = () => {
        if (questionNum === questions.length - 1) { //when is last question
            handleSetAnswers(choice, questionNum, true)
            setQuestionNum(0)
            setChosenId(null)
            setCompleted(true)
            return
        }
        if (questions[questionNum].required === true && choice === '') { return }
        handleSetAnswers(choice, questionNum)
        const newQuestion = questionNum + 1
        setQuestionNum(newQuestion)
    }

    const handlePrevious = () => {
        if (questionNum <= 0) {
            return
        }
        const newQuestion = questionNum - 1
        setQuestionNum(newQuestion)
        setChoice('')
    }

    const handleSkip = () => {
        handleNext()
    }

    return (
        <>
            {!chosenId && !completed &&
                <div className="user-list">
                    {users.map(({ firstName, avatar, id, lastName }) => {
                        const isSubmitted = feedbackData[id]?.isSubmitted

                        return (
                            <div key={id} className="userCard">
                                <div className="card-left">
                                    <img src={avatar} alt="avatar of user" className="avatar" />
                                    <div className="fullName">{firstName} {lastName}</div>
                                </div>
                                {
                                    isSubmitted
                                        ? <Link to="/my-feedback">View Feedback</Link>
                                        : <button className="btn card-right" onClick={() => handleFirstClick(id)}>Leave Feedback</button>

                                }
                            </div>
                        )
                    })
                    }
                </div>
            }
            {
                chosenId &&
                <div className="question-div">
                    <h2 className="question-label">{questions[questionNum].label}</h2>
                    <div className="feedback-container">
                        {questions[questionNum].type === 'scale' && <Rating handleChoice={setChoice} choice={choice} />}
                        {questions[questionNum].type === 'multipleChoice' && <Choice data={questions[questionNum]} handleChoice={setChoice} choice={choice} />}
                        {questions[questionNum].type === 'text' && <Text choice={choice} handleChoice={setChoice} />}
                    </div>
                    <div className="nav-tools">
                        <button onClick={handlePrevious}>Previous</button>
                        {!questions[questionNum].required &&
                            <button onClick={handleSkip}>Skip</button>
                        }
                        <button onClick={handleNext}>Next</button>
                    </div>
                </div>
            }
            {
                completed &&
                <div className="user-list">
                    {users
                        .filter(({ id }) => !feedbackData[id]?.isSubmitted)
                        .map(({ firstName, avatar, id, lastName }) => {
                            return (
                                <div key={id} className="userCard">
                                    <div className="card-left">
                                        <img src={avatar} alt="avatar of user" className="avatar" />
                                        <div className="fullName">{firstName} {lastName}</div>
                                    </div>
                                    <button className="btn card-right" onClick={() => handleFirstClick(id)}>Leave Feedback</button>
                                </div>
                            )
                        })
                    }
                </div>
            }
        </>
    )
}

export default Users






//impsiotare is submitted da non fare ricvedfere gli user completi nella lsit ainiziale in modo che a seconda del true o false compaia un bottone diverso

//ultima pagina mostrare gli utienti per cui issubmitted è false filtrando quelli gia completi
