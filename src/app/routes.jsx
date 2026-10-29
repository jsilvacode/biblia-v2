import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { getReaderPath } from '../features/bible/readerPath'
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

function LegacyReaderRedirect() {
  const { book, chapter, verse } = useParams()
  const location = useLocation()
  return <Navigate replace state={location.state} to={{
    pathname: getReaderPath({ book: Number(book), chapter: Number(chapter), verse: Number(verse) || null }),
    search: location.search,
    hash: location.hash,
  }} />
}

function PreserveLocationRedirect({ pathname }) {
  const location = useLocation()
  return <Navigate replace state={location.state} to={{ pathname, search: location.search, hash: location.hash }} />
}

function LegacyBeliefRedirect() {
  const { slug } = useParams()
  return <PreserveLocationRedirect pathname={slug ? `/creencias/${slug}` : '/creencias'} />
}

function LegacyStudyRedirect() {
  const { lessonSlug } = useParams()
  return <PreserveLocationRedirect pathname={lessonSlug ? `/fe-de-jesus/${lessonSlug}` : '/fe-de-jesus'} />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DeferredRoute><HomePage /></DeferredRoute>} />
        <Route path="biblia" element={<DeferredRoute><BibleBrowserPage /></DeferredRoute>} />
        <Route path="biblia/:book/:chapter/:verse?" element={<DeferredRoute><ReaderPage /></DeferredRoute>} />
        <Route path="bible" element={<PreserveLocationRedirect pathname="/biblia" />} />
        <Route path="read/:book/:chapter/:verse?" element={<LegacyReaderRedirect />} />
        <Route path="search" element={<DeferredRoute><SearchPage /></DeferredRoute>} />
        <Route path="saved" element={<DeferredRoute><SavedPage /></DeferredRoute>} />
        <Route path="plans" element={<DeferredRoute><PlansPage /></DeferredRoute>} />
        <Route path="reavivados" element={<DeferredRoute><DailyReadingPage /></DeferredRoute>} />
        <Route path="este-dia-con-dios" element={<DeferredRoute><DailyVideoPage /></DeferredRoute>} />
        <Route path="este-dia-con-dios/:date" element={<DeferredRoute><DailyVideoPage /></DeferredRoute>} />
        <Route path="topics" element={<DeferredRoute><TopicsPage /></DeferredRoute>} />
        <Route path="topics/:categoryId/:situationId" element={<DeferredRoute><TopicsPage /></DeferredRoute>} />
        <Route path="creencias" element={<DeferredRoute><BeliefsPage /></DeferredRoute>} />
        <Route path="creencias/:slug" element={<DeferredRoute><BeliefsPage /></DeferredRoute>} />
        <Route path="beliefs" element={<LegacyBeliefRedirect />} />
        <Route path="beliefs/:slug" element={<LegacyBeliefRedirect />} />
        <Route path="fe-de-jesus" element={<DeferredRoute><StudyIndexPage /></DeferredRoute>} />
        <Route path="fe-de-jesus/:lessonSlug" element={<DeferredRoute><StudyLessonPage /></DeferredRoute>} />
        <Route path="fedejesus" element={<PreserveLocationRedirect pathname="/fe-de-jesus" />} />
        <Route path="fedejesus/:lessonSlug" element={<LegacyStudyRedirect />} />
        <Route path="studies/la-fe-de-jesus" element={<LegacyStudyRedirect />} />
        <Route path="studies/la-fe-de-jesus/:lessonSlug" element={<LegacyStudyRedirect />} />
        <Route path="settings" element={<Navigate replace state={{ openSettings: true }} to="/" />} />
        <Route path="about" element={<DeferredRoute><AboutPage /></DeferredRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
