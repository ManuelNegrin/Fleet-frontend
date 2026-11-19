import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "./SideBar";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return <div className="app-layout"><SideBar /><main className="content-area p-3 p-md-4"><Outlet /></main></div>;
}
