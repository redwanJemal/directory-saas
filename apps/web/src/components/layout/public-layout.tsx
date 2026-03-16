import { Outlet } from 'react-router';
import { PublicHeader } from './public-header';
import { PublicFooter } from './public-footer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
