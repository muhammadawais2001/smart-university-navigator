export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-2xl space-y-3 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Privacy notice</h1>
      <p>Smart University Navigator is an independent student project. It is not an official Air University service.</p>
      <h2 className="text-lg font-semibold">Your location</h2>
      <p>Location access is optional and only requested when you press a location button. Your position is read in your browser to draw a dot on the map or to start a route. It is not stored, and it is not sent to our servers. When you request a walking route, the start and end coordinates are sent to the configured routing service so it can calculate the path. GPS cannot position you indoors.</p>
      <h2 className="text-lg font-semibold">Reports</h2>
      <p>If you submit a report, we store the issue type, description, optional related place and optional contact detail you enter, so administrators can review it. Do not include sensitive personal information.</p>
      <h2 className="text-lg font-semibold">Maps</h2>
      <p>Map tiles are loaded from OpenStreetMap servers, which receive your IP address as part of normal web requests. Map data © OpenStreetMap contributors.</p>
      <h2 className="text-lg font-semibold">Administrators</h2>
      <p>Administrator accounts are managed through Supabase Authentication. Administrative changes are recorded in an audit log.</p>
    </article>
  );
}
