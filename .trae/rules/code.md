---
alwaysApply: false
description: 确保 SDK 生成脚本包含 --module-name-first-tag 以保持方法的分组层级，并确保路径参数正确转义。
---
SDK 生成：始终确保 generate:sdk 脚本包含 --module-name-first-tag 以保持方法的分组层级，并确保路径参数正确转义。
依赖管理：在单体仓库中，前端应直接链接本地 nocodb-sdk 包，避免引入未发布的 v2 预览版包。
代码一致性：如果 SDK 方法名发生变化，必须同步更新 filterUtils.ts 等工具类中的调用。