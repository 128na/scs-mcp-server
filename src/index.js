"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const axios_1 = __importStar(require("axios"));
const zod_1 = require("zod");
const appName = "SimutransCrossSearchMcpServer";
const appVersion = "0.0.1";
const server = new mcp_js_1.McpServer({ name: appName, version: appVersion });
server.tool("search", {
    keyword: zod_1.z.string().describe("検索キーワード（例：駅舎、道路など）"),
    paks: zod_1.z.array(zod_1.z.enum(['64', '128', '128-japan'])),
    sites: zod_1.z.array(zod_1.z.enum(['japan', 'twitrans', 'portal'])),
    page: zod_1.z.number().optional().default(1)
}, (_a) => __awaiter(void 0, [_a], void 0, function* ({ keyword, paks, sites, page }) {
    var _b;
    console.info({ keyword, paks, sites, page });
    try {
        const q = new URLSearchParams();
        q.set('keyword', keyword);
        paks.forEach(p => q.append('paks[]', p));
        sites.forEach(s => q.append('sites[]', s));
        q.set('page', page.toString());
        const res = yield axios_1.default.get(`https://cross-search.128-bit.net/api/v2/search?${q.toString()}`, {
            headers: {
                'User-Agent': `${appName}/${appVersion}`,
                'Accept': 'application/json',
            },
        });
        console.error('response::' + JSON.stringify(res.data.data));
        const formatted = res.data.data.map((r, i) => `${i + 1}. [${r.title}](${r.url})（サイト：${r.site}、パックセット：${r.paks.join(',')}）`).join('\n');
        console.info({ formatted });
        return {
            content: [{
                    type: "text",
                    text: res.data.data.length > 0
                        ? `検索結果:\n${formatted}`
                        : '該当するアドオン記事が見つかりませんでした。',
                }]
        };
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            console.error((_b = error.response) === null || _b === void 0 ? void 0 : _b.data);
            return {
                content: [{
                        type: 'text',
                        json: true,
                        text: JSON.stringify(error.response)
                    }]
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: '検索中に不明なエラーが発生しました'
                }]
        };
    }
}));
const transport = new stdio_js_1.StdioServerTransport();
console.error("Starting MCP server...");
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield server.connect(transport);
    console.error("Server connected and ready to handle requests.");
}))();
