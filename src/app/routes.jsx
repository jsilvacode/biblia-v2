import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { loadReaderPage } from '../features/reader/preloadReading'
import { RouteErrorBoundary, RouteLoading } from './RouteErrorBoundary'

const HomePage = lazy(() => import('../features/home/HomePage'))
const BibleBrowserPage = lazy(() => import('../features/bible/BibleBrowserPage'))
const ReaderPage = lazy(loadReaderPage)
const SearchPage = lazy(() => import('../features/search/SearchPage'))
const SavedPage = lazy(() => import('../features/saved/SavedPage'))
const AboutPage = lazy(() => import('../features/about/AboutPage'))
const PlansPage = lazy(() => import('../features/plans/PlansPage'))
const DailyReadingPage = lazy(() => import('../features/plans/DailyReadingPage'))
const DailyVideoPage = lazy(() => import('../features/daily-video/DailyVideoPage'))
const TopicsPage = lazy(() => import('../features/topics/TopicsPage'))
const BeliefsPage = lazy(() => import('../features/beliefs/BeliefsPage'))
const StudyIndexPage = lazy(() => import('../features/studies/StudyIndexPage'))
const StudyLessonPage = lazy(() => import('../features/studies/StudyLessonPage'))

function DeferredRoute({ children }) {
  return <RouteErrorBoundary><Suspense fallback={<RouteLoading />}>{children}</Suspense></RouteErrorBoundary>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DeferredRoute><HomePage /></DeferredRoute>} />
        <Route path="bible" element={<DeferredRoute><BibleBrowserPage /></DeferredRoute>} />
        <Route path="read/:book/:chapter/:verse?" element={<DeferredRoute><ReaderPage /></DeferredRoute>} />
        <Route path="search" element={<DeferredRoute><SearchPage /></DeferredRoute>} />
        <Route path="saved" element={<DeferredRoute><SavedPage /></DeferredRoute>} />
        <Route path="plans" element={<DeferredRoute><PlansPage /></DeferredRoute>} />
        <Route path="reavivados" element={<DeferredRoute><DailyReadingPage /></DeferredRoute>} />
        <Route path="este-dia-con-dios" element={<DeferredRoute><DailyVideoPage /></DeferredRoute>} />
        <Route path="este-dia-con-dios/:date" element={<DeferredRoute><DailyVideoPage /></DeferredRoute>} />
        <Route path="topics" element={<DeferredRoute><TopicsPage /></DeferredRoute>} />
        <Route path="topics/:categoryId/:situationId" element={<DeferredRoute><TopicsPage /></DeferredRoute>} />
        <Route path="beliefs" element={<DeferredRoute><BeliefsPage /></DeferredRoute>} />
        <Route path="beliefs/:slug" element={<DeferredRoute><BeliefsPage /></DeferredRoute>} />
        <Route path="studies/la-fe-de-jesus" element={<DeferredRoute><StudyIndexPage /></DeferredRoute>} />
        <Route path="studies/la-fe-de-jesus/:lessonSlug" element={<DeferredRoute><StudyLessonPage /></DeferredRoute>} />
        <Route path="settings" element={<Navigate replace state={{ openSettings: true }} to="/" />} />
        <Route path="about" element={<DeferredRoute><AboutPage /></DeferredRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
