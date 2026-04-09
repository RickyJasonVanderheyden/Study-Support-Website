import React from 'react';
import Card from '../components/common/Card';
import { Search, Users, Mail, ShieldCheck } from 'lucide-react';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';

const Module4Page = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#FDFCF9]">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[#D8E8DC] bg-[#FFFDF8] p-8 shadow-2xl shadow-[rgba(30,77,53,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7A9080]">Member search</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-[#173e1f]">Find classmates, groups, and study connections</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#3D5246]">
              Search members, manage invites, and build your study network from one place.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Search', value: 'Find members quickly', icon: Search },
                { label: 'Connect', value: 'Collaborate with peers', icon: Users },
                { label: 'Invite', value: 'Send study invites', icon: Mail },
                { label: 'Trust', value: 'Keep it student-safe', icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} className="border border-[#D8E8DC] bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#7A9080]">{item.label}</p>
                        <p className="mt-2 text-lg font-bold text-[#1A2E23]">{item.value}</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#1E4D35] to-[#E8820C] text-white shadow-md">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8">
              <Card title="Search workspace" className="border border-[#D8E8DC] bg-white shadow-sm">
                <p className="text-sm leading-6 text-[#3D5246]">
                  This area is ready for the member finder UI. The shared header now gives you consistent access to profile, dashboard, and logout.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Module4Page;
