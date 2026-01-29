import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function UploadPage() {
  const { style } = Route.useSearch() as { style?: string };

  if (!style) {
    throw redirect({ to: "/" });
  }

  return (
    <div>
      <h1>Upload Photo</h1>
      <p>Selected style: {style}</p>
    </div>
  );
}
