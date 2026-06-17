import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import ExamCenter from '@/pages/exam-center/ExamCenter'
import CreateSession from '@/pages/exam-center/CreateSession'
import ScorePublish from '@/pages/exam-center/ScorePublish'
import CandidateHome from '@/pages/candidate/CandidateHome'
import Registration from '@/pages/candidate/Registration'
import MyRegistrations from '@/pages/candidate/MyRegistrations'
import JudgeHome from '@/pages/judge/JudgeHome'
import ScoreEntry from '@/pages/judge/ScoreEntry'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exam-center" element={<ExamCenter />} />
        <Route path="/exam-center/create" element={<CreateSession />} />
        <Route path="/exam-center/scores" element={<ScorePublish />} />
        <Route path="/candidate" element={<CandidateHome />} />
        <Route path="/candidate/register/:sessionId" element={<Registration />} />
        <Route path="/candidate/my-registrations" element={<MyRegistrations />} />
        <Route path="/judge" element={<JudgeHome />} />
        <Route path="/judge/score/:registrationId" element={<ScoreEntry />} />
      </Routes>
    </Router>
  )
}
