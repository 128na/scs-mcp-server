import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types";
import axios, { AxiosError } from 'axios';
import { z } from "zod";

const appName = "SimutransCrossSearchMcpServer";
const appVersion = "0.0.1";
const server = new McpServer(
    { name: appName, version: appVersion },
);

server.tool("search",
    {
        keyword: z.string().describe("検索キーワード（例：駅舎、道路など）"),
        paks: z.array(z.enum(['64', '128', '128-japan'])),
        sites: z.array(z.enum(['japan', 'twitrans', 'portal'])),
        page: z.number().optional().default(1)
    },
    async ({ keyword, paks, sites, page }, extra) => {
        const content: { type: "text"; text: string }[] = [];
        content.push({ type: "text", text: `検索条件：キーワード：${keyword}、パックセット：${paks.join(',')}、サイト：${sites.join(',')}` });
        try {
            const q = new URLSearchParams();
            q.set('keyword', keyword);
            paks.forEach(p => q.append('paks[]', p));
            sites.forEach(s => q.append('sites[]', s));
            q.set('page', page.toString());
            const res = await axios.get(`https://cross-search.128-bit.net/api/v2/search?${q.toString()}`, {
                headers: {
                    'User-Agent': `${appName}/${appVersion}`,
                    'Accept': 'application/json',
                },
            });

            if (res.data.data.length === 0) {
                content.push({ type: "text", text: '該当するアドオンが見つかりませんでした。' });
            } else {
                content.push({ type: "text", text: `検索結果は${res.data.meta.total}件。1ページ辺り${res.data.meta.per_page}件。${res.data.meta.last_page}ページ中${res.data.meta.current_page}ページ目の結果を取得。` });
                content.push({
                    type: "text", text: res.data.data.map((r: any, i: number) =>
                        `${i + 1}. [${r.title}](${r.url})（サイト：${r.site}、パックセット：${r.paks.join(',')}）`
                    ).join('\n')
                });
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                content.push({ type: "text", text: '検索中にエラーが発生しました。' });
            } else {
                content.push({ type: "text", text: '検索中に不明なエラーが発生しました。' });
            }
        }
        return { content };
    },
);

const transport = new StdioServerTransport();
console.error("Starting MCP server...");
(async () => {
    await server.connect(transport);
    console.error("Server connected and ready to handle requests.");
})();
