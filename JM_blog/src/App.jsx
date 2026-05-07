import { useState } from 'react';
import Layout from './components/Layout';
import AIWriter from './components/AIWriter';
import PostEditor from './components/PostEditor';
import DraftList from './components/DraftList';
import PostedList from './components/PostedList';
import Settings from './components/Settings';
import SiteManager from './components/SiteManager';
import SeriesGenerator from './components/SeriesGenerator';
import ScheduleManager from './components/ScheduleManager';
import { getAuth } from './utils/storage';
import './App.css';

export default function App() {
  const [page, setPage] = useState('sites');
  const [editDraft, setEditDraft] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [auth, setAuth] = useState(getAuth());

  const handleNav = (key) => {
    setPage(key);
    if (key !== 'write') setEditDraft(null);
  };

  const handleEditDraft = (draft) => {
    setEditDraft(draft);
    setPage('write');
  };

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    setPage('series');
  };

  const renderPage = () => {
    switch (page) {
      case 'sites':
        return <SiteManager onNav={handleNav} onSelectSite={handleSelectSite} />;
      case 'series':
        return <SeriesGenerator onNav={handleNav} initialSite={selectedSite} />;
      case 'schedule':
        return <ScheduleManager onNav={handleNav} />;
      case 'ai':
        return <AIWriter onNav={handleNav} />;
      case 'write':
        return (
          <PostEditor
            key={editDraft?.id || 'new'}
            draft={editDraft}
            onSaved={() => {}}
            onNav={handleNav}
          />
        );
      case 'drafts':
        return <DraftList onEdit={handleEditDraft} />;
      case 'posted':
        return <PostedList />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <Layout page={page} onNav={handleNav} user={auth?.user}>
      {renderPage()}
    </Layout>
  );
}
