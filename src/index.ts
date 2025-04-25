import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
    async ({ keyword, paks, sites, page }) => {
        console.info({ keyword, paks, sites, page });
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
            console.error('response::' + JSON.stringify(res.data.data));
            const formatted = res.data.data.map((r: any, i: number) =>
                `${i + 1}. [${r.title}](${r.url})（サイト：${r.site}、パックセット：${r.paks.join(',')}）`
            ).join('\n');
            console.info({ formatted });

            return {
                content: [{
                    type: "text",
                    text: res.data.data.length > 0
                        ? `検索結果:\n${formatted}`
                        : '該当するアドオン記事が見つかりませんでした。',
                }]
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error(error.response?.data);
                return {
                    content: [{
                        type: 'text',
                        json: true,
                        text: JSON.stringify(error.response)
                    }]
                }
            }
            return {
                content: [{
                    type: 'text',
                    text: '検索中に不明なエラーが発生しました'
                }]
            }
        }
    },
);

const transport = new StdioServerTransport();
console.error("Starting MCP server...");
(async () => {
    await server.connect(transport);
    console.error("Server connected and ready to handle requests.");
})();
