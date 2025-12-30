# 发布检查清单

## 发布前检查

- [ ] 更新 CHANGELOG.md
- [ ] 更新 package.json 版本号
- [ ] 运行所有测试: `pnpm test`
- [ ] 运行 lint: `pnpm run lint`
- [ ] 检查打包大小: `pnpm run package`
- [ ] 本地测试扩展功能
- [ ] 更新 README(如有新功能)

## 发布流程

```bash
# 1. 确保在 main 分支且代码最新
git checkout main
git pull

# 2. 更新版本号
# 手动编辑 package.json 或使用:
# npm version patch/minor/major

# 3. 更新 CHANGELOG
# 手动编辑 CHANGELOG.md

# 4. 提交更改
git add .
git commit -m "chore: release v0.x.x"
git tag v0.x.x
git push origin main --tags

# 5. 发布到市场
pnpm run publish
```

## 发布后

- [ ] 在 GitHub 创建 Release
- [ ] 社区公告(可选)
- [ ] 关闭相关 issues
- [ ] 更新 Wiki(如需要)
