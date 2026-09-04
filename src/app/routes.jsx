import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

const HomePage = lazy(() => import('../features/home/HomePage'))
const BibleBrowserPage = lazy(() => import('../features/bible/BibleBrowserPage'))
const ReaderPage = lazy(() => import('../features/reader/ReaderPage'))
const SearchPage = lazy(() => import('../features/search/SearchPage'))
const SavedPage = lazy(() => import('../features/saved/SavedPage'))
const PlansPage = lazy(() => import('../features/plans/PlansPage'))
const TopicsPage = lazy(() => import('../features/topics/TopicsPage'))
const StudyIndexPage = lazy(() => import('../features/studies/StudyIndexPage'))
const StudyLessonPage = lazy(() => import('../features/studies/StudyLessonPage'))

function RouteLoading() {
  return <div className="route-loading" aria-live="polite" />
}

function DeferredRoute({ children }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>
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
        <Route path="topics" element={<DeferredRoute><TopicsPage /></DeferredRoute>} />
        <Route path="studies/la-fe-de-jesus" element={<DeferredRoute><StudyIndexPage /></DeferredRoute>} />
        <Route path="studies/la-fe-de-jesus/:lessonSlug" element={<DeferredRoute><StudyLessonPage /></DeferredRoute>} />
        <Route path="settings" element={<Navigate replace state={{ openSettings: true }} to="/" />} />
        <Route path="about" element={<Navigate replace state={{ openSettings: true }} to="/" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
