import React from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';

const POCKETGROVE_DEVELOPER_BLOG_URL = 'https://pocketgrove.com/blog/developer/';
const developerPosts = [
  {
    title: 'Stop putting everything in CLAUDE.md',
    description: 'A practical way to separate always-on project rules from task-specific agent skills.',
    path: 'https://pocketgrove.com/blog/stop-putting-everything-in-claude-md/',
    content: 'stop-putting-everything-in-claude-md',
  },
  {
    title: 'Build huge agent knowledge bases without huge context windows',
    description: 'How layered references and retrieval keep large engineering knowledge useful.',
    path: 'https://pocketgrove.com/blog/how-to-build-huge-agent-knowledge-bases-without-huge-context-windows/',
    content: 'huge-agent-knowledge-bases',
  },
  {
    title: 'Your CLAUDE.md needs tests too',
    description: 'Treat agent instructions like executable project behaviour: test them, audit them, and keep them current.',
    path: 'https://pocketgrove.com/blog/your-claude-md-needs-tests-too/',
    content: 'claude-md-needs-tests',
  },
];

const trackedUrl = (path: string, content: string) =>
  `${path}?utm_source=congle&utm_medium=referral&utm_campaign=developer_blog&utm_content=${content}`;

const DeveloperNotes: React.FC = () => {
  return (
    <section id="developer-notes" className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
          <BookOpen className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-[0.18em]">Developer notes</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl text-center">
          Practical notes from building with AI
        </h2>
        <p className="mt-5 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center">
          I write about the engineering systems behind a large iOS app portfolio: agent instructions,
          reusable knowledge, testing, and the lessons that hold up in real projects. The full developer
          articles live on PocketGrove, alongside the apps they help ship.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {developerPosts.map((post) => (
            <article
              key={post.title}
              className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
            >
              <h3 className="text-xl font-bold leading-snug text-gray-900 dark:text-white">{post.title}</h3>
              <p className="mt-3 flex-1 text-gray-600 dark:text-gray-400 leading-relaxed">{post.description}</p>
              <a
                href={trackedUrl(post.path, post.content)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Read the essay
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href={trackedUrl(POCKETGROVE_DEVELOPER_BLOG_URL, 'developer-notes-hub')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Browse all developer notes
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default DeveloperNotes;
