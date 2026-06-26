# ATLAS CashOps — 版权与所有权声明（Copyright & Ownership Statement）

> 本文件是一份正式的知识产权归属声明，用于证明 **ATLAS CashOps** 这一软件产品的全部权利
> 归属于您（"所有人 / Owner"）。请把文中的占位 `linmuye45-ai` 替换为您的**真实法定姓名或公司主体名称**，
> 替换后即构成完整的归属凭据。

---

## 1. 权利人（Owner）

| 项目 | 内容 |
| --- | --- |
| 所有人（占位，请替换） | **linmuye45-ai** |
| 产品名称 | ATLAS CashOps |
| 产品定位 | 面向小微企业的现金流预警与催收行动平台（cashflow early-warning & collections action layer） |
| 版权年份 | 2026 |
| 代码仓库 | https://github.com/linmuye45-ai/awesome-design-md |
| 许可模式 | 专有（Proprietary，非开源）— 见仓库根目录 `LICENSE` |

> ⚠️ 重要：当前 GitHub 账号名 `linmuye45-ai` 仅为默认占位。要让本声明具备法律效力，
> 请用您的真实姓名（自然人）或公司全称（法人主体）替换本文件、`LICENSE`、以及源码文件头中的同名占位。

---

## 2. 权利声明（Statement of Rights）

本人/本公司声明，对 ATLAS CashOps 软件产品享有**完整、独占、排他**的全部权利，包括但不限于：

1. **著作权（Copyright）** — 全部源代码、目标代码、编译产物。
2. **界面与设计** — 所有页面布局、视觉设计、交互流程、组件库（`src/components/`）。
3. **国际化资产** — 全部 12 种语言的本地化文案数据集（`src/i18n/locales/`，共 456 个键 × 12 语言）及其结构。
4. **核心算法引擎** — 确定性的现金流预测引擎（`forecast.ts`）、催收优先级评分（`collections.ts`）、
   应付账款处置策略（`payables.ts`）、指标计算（`metrics.ts`）。
5. **AI 顾问契约层** — AI 工具注册表、意图路由、响应契约（`advisor.ts`、`ai-contract.ts`）。
6. **领域模型与架构** — 数据模型（`domain.ts`）、状态管理、权限/多租户隔离模型（`permissions.ts`）。
7. **文档与商业资产** — 本 `docs/` 目录下的全部商业计划、上架指导、财务模型等文件。
8. **商标与品牌** — "ATLAS" / "ATLAS CashOps" 名称、标识（`src/app/icon.svg`）及相关品牌要素
   （注：文字商标的排他权利需另行向商标局申请注册，本声明仅主张在先使用权）。

---

## 3. 创作与权属证据（Authorship & Provenance）

- **创作方式**：本产品由所有人主导需求与产品定义，借助 AI 编程助手作为工具完成实现。
  在绝大多数司法辖区，**使用 AI 工具创作的作品，其权利归属于指导和组织该创作的自然人/法人**（即您），
  正如使用任何其他软件工具（编辑器、编译器）创作不影响作者归属。
- **时间戳证据**：Git 提交历史（`git log`）为每一次创作提供了带时间戳的不可篡改记录，
  可作为创作时间与演进过程的证据链。建议保留仓库完整历史。
- **建议强化措施**（可选，进一步加固权属）：
  1. 在中国可向**中国版权保护中心**申请《计算机软件著作权登记证书》（软著），通常 30+ 个工作日下证，是国内最直接的权属凭据。
  2. 将本仓库打一个带签名的 Git tag（`git tag -s v1.0.0`）并归档。
  3. 把交付包（见 `docs/`）上传至带时间戳的云存储或邮寄给自己（邮戳存证）。

---

## 4. 第三方开源组件（Third-Party Components）

本产品**站在巨人的肩膀上**，使用了下列开源依赖。它们各自的许可证仅约束**该组件本身**，
**不影响**您对自有原创代码的完整版权：

| 组件 | 用途 | 许可证 |
| --- | --- | --- |
| Next.js | 应用框架（App Router） | MIT |
| React / React-DOM | UI 运行时 | MIT |
| Tailwind CSS | 样式系统 | MIT |
| Zustand | 客户端状态管理 | MIT |
| Recharts | 图表 | MIT |
| lucide-react | 图标 | ISC |
| clsx / tailwind-merge | 类名工具 | MIT |

> 这些许可证均为宽松型（permissive），允许商业闭源使用与销售，**无 copyleft 传染性**，
> 因此您可以放心地将本产品作为专有商业软件出售。

---

## 5. 关于上游仓库（Upstream Notice）

本项目最初的 Git 仓库 fork 自第三方设计参考仓库（其历史 `LICENSE` 归属 "VoltAgent"，MIT）。
**ATLAS CashOps 的全部应用代码均为本项目下的全新原创创作**，与上游设计参考仓库的内容无实质关联。
为避免混淆，仓库根目录的 `LICENSE` 已更新为归属于您的专有许可。如需彻底切割，建议：

```bash
# 可选：创建一个不含上游历史的全新仓库，仅保留本产品代码
git checkout --orphan clean-main
git add -A && git commit -m "ATLAS CashOps v1.0 — initial proprietary release"
```

---

## 6. 署名替换清单（Replace-Your-Name Checklist）

在对外交付/销售前，请把所有 `linmuye45-ai` 占位替换为您的真实主体：

- [ ] `LICENSE`（根目录）
- [ ] `docs/COPYRIGHT_AND_OWNERSHIP.md`（本文件）
- [ ] `docs/BUSINESS_PLAN.md` 页脚
- [ ] `README.md` 版权行（如有）
- [ ] 源码文件头（如计划逐文件加版权头，可用一次性脚本批量插入）

一键全局替换示例（在仓库根执行，将 `Your Real Name` 换成您的主体名）：

```bash
grep -rl "linmuye45-ai" --include="*.md" --include="LICENSE" . \
  | xargs sed -i 's/linmuye45-ai/Your Real Name/g'
```

---

_本声明自您完成署名替换之日起生效。最后更新：2026-06-18。_
