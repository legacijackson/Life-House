export default function WorkshopStudio() {
  const url = (import.meta as any).env?.VITE_WORKSHOP_STUDIO_URL ?? "https://lifehousereentry.netlify.app";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="px-6 py-3 border-b bg-white flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Workshop Studio</h1>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Open in new tab ↗
        </a>
      </div>
      <iframe
        src={url}
        style={{ width: "100%", flex: 1, border: "none" }}
        allow="fullscreen; camera; microphone"
        title="Life House Workshop Studio"
      />
    </div>
  );
}
