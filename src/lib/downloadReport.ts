import { API_BASE_URL } from "@/lib/apiBase";
import { refreshSession } from "@/lib/authSession";
import { reportRequest } from "@/redux/slices/reportsApiSlice";
import type { ReportParams } from "@/lib/reportQuery";

export type DownloadFormat = "pdf" | "xlsx" | "csv";

/** Same rule as baseApi: an explicit outlet choice wins, otherwise the active branch. */
function outletHeader(chosen: string | undefined): string | null {
  if (chosen) return chosen;
  try {
    return localStorage.getItem("alayn_active_branch_id");
  } catch {
    return null;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error?.message === "string") return body.error.message;
  } catch {
    /* not JSON */
  }
  return res.status === 401 ? "Please sign in again to download this report." : "Couldn't download this report. Please try again.";
}

function fileNameFrom(res: Response): string {
  const header = res.headers.get("Content-Disposition") ?? "";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      /* fall through to the plain name */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : "report";
}

/**
 * Downloads the report as PDF, Excel or one CSV table. Throws an Error carrying the server's
 * message when the download is refused.
 */
export async function downloadReport(params: ReportParams, format: DownloadFormat, section?: string): Promise<void> {
  const { query, outletHeader: chosen } = reportRequest(params);
  const search = new URLSearchParams(query);
  search.set("format", format);
  if (section) search.set("section", section);
  const url = `${API_BASE_URL}/reports/export?${search.toString()}`;

  const headers: Record<string, string> = { "x-portal": "tenant" };
  const outlet = outletHeader(chosen);
  if (outlet) headers["x-outlet-id"] = outlet;

  let res = await fetch(url, { credentials: "include", headers });
  if (res.status === 401 && (await refreshSession()).ok) {
    res = await fetch(url, { credentials: "include", headers });
  }
  if (!res.ok) throw new Error(await readError(res));

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileNameFrom(res);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
