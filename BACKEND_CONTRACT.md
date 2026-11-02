# 前后端对接约定（待后端确认）

当前运行使用演示数据与 IndexedDB，未连接真实接口。下面是前端适配器的提议，不能当作已有服务。

## 配置读写

在 `.env.local` 配置 `VITE_DASHBOARD_API_BASE_URL` 后，`src/services/dashboardGateway.ts` 才切换为 HTTP 模式。留空使用本地模式。

| 方法 | 相对路径 | 请求 | 预期响应 |
| --- | --- | --- | --- |
| GET | `/dashboard/config/draft` | 无 | `{ document: DashboardDocument }`；无草稿时 204 |
| GET | `/dashboard/config/published` | 无 | `{ document: DashboardDocument }`；无发布时 204 |
| PUT | `/dashboard/config/draft` | `{ document: DashboardDocument }` | 2xx |
| POST | `/dashboard/config/publish` | `{ document: DashboardDocument }` | 2xx，原子更新展示版本 |

完整类型见 `src/types/editor.ts` 和 `src/types/dashboard.ts`，默认示例由 `createDefaultDocument()` 生成。版本字段为 `schemaVersion: 1`；布局使用 2560 × 1440 设计坐标。读入时进行结构、尺寸、碰撞、颜色、素材地址和内容数量校验。当前请求携带 Cookie，超时 15 秒；需要后端确认会话、跨域、权限、错误格式和并发版本策略。

## 真实数据

待明确图书借阅、读者借阅、检索热度、到馆统计、天气等业务字段、统计周期、脱敏规则与刷新周期。`RankingItem.value` 为非负数，检索热度影响词云字号；正式业务统计由后端提供，不能把当前演示数值当作真实结果。

正式接入时，应在页面边界合并配置和业务数据，再通过 props 传给展示组件，避免各组件自行请求和各自定义接口。

## 素材与同步

本地上传保存在当前浏览器 IndexedDB，以 `local-media:ID` 引用。**这些引用不能用于跨设备的远程发布**。远程使用前，需后端提供素材上传/存储接口，并在前端上传适配器中将引用转换为所有展示端可访问的 HTTPS 地址；同时确认大小限制、删除/保留策略、视频编码、CORS 与鉴权。

当前本地发布通过同源窗口的 storage 事件同步；没有跨设备同步和远端发布推送。真实服务还需确定轮询、SSE 或 WebSocket、配置版本与冲突处理。

展示参数 `?display=1` 仅隐藏编辑入口，不提供身份验证；编辑权限必须由正式系统验证。后端服务、数据库、登录鉴权和生产部署均不在本次前端实现范围内。


## 固定版位模板字段

`DashboardDocument.composition` 是可选字段，旧文档不含此字段时继续使用原自由布局：

```json
{"composition":{"templateId":"three-left","slots":["hero","books","searches"]}}
```

`slots` 长度必须与模板版位数一致；组件 ID 不可重复，null 表示空版位。`layout` 是当前模板展开后的规范坐标及显隐结果，前端验证它与模板定义一致。后端持久化配置时需保留 `composition`。当前有 15 个模板；增加或调整模板定义应同时考虑已保存文档的兼容和版本策略。此字段随草稿、发布与备份一并保存，不涉及本次新增后端接口。
