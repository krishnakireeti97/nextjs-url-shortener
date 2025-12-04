import { prisma } from "@/lib/prisma";

type ParamsShape = {
  code: string;
};
type Props = {
  params?: ParamsShape | Promise<ParamsShape>;
};

export default async function CodeStatsPage({ params }: Props) {
  const resolvedParams = (params && typeof (params as any).then === "function")
    ? await (params as Promise<ParamsShape>)
    : (params as ParamsShape | undefined);

  const code = resolvedParams?.code ?? "";

  if (!code) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Not found</h1>
        <p className="text-gray-600 text-lg">No short code provided in the URL.</p>
      </div>
    );
  }

  const record = await prisma.url.findUnique({ where: { shortCode: code } });

  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Not found</h1>
        <p className="text-gray-600 text-lg">
          Short code <span className="font-semibold text-indigo-600">{code}</span> does not exist.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <article className="w-full max-w-lg bg-white rounded-xl shadow-md p-8">
        <header className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Stats for <span className="text-indigo-600">{record.shortCode}</span>
          </h1>
          <p className="text-gray-700 text-lg">
            Target URL:
            <a
              href={record.originalUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-indigo-600 hover:underline break-all"
              title={record.originalUrl}
            >
              {record.originalUrl}
            </a>
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-gray-800">
          <div className="bg-indigo-50 p-4 rounded-lg text-center shadow-inner">
            <dt className="text-sm font-semibold text-indigo-700 mb-1 uppercase tracking-wide">Total Clicks</dt>
            <dd className="text-3xl font-bold">{record.clicks}</dd>
          </div>

          <div className="bg-green-50 p-4 rounded-lg text-center shadow-inner">
            <dt className="text-sm font-semibold text-green-700 mb-1 uppercase tracking-wide">Created</dt>
            <dd className="text-base font-medium">{new Date(record.createdAt).toLocaleString()}</dd>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg text-center shadow-inner">
            <dt className="text-sm font-semibold text-yellow-700 mb-1 uppercase tracking-wide">Last Clicked</dt>
            <dd className="text-base font-medium">
              {record.lastClicked ? new Date(record.lastClicked).toLocaleString() : "—"}
            </dd>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg text-center shadow-inner">
            <dt className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">ID</dt>
            <dd className="text-base font-medium">{record.id}</dd>
          </div>
        </section>
      </article>
    </main>
  );
}
