# Vue 3 + Vite + TypeScript 移行 (#2)

## 方針

- Vue CLI 3 / babel / core-js を撤去し、Vite + `@vitejs/plugin-vue` に置き換える。出力は `dist/`、base は `/`（tax-answer.net 直下に手動デプロイ）
- TypeScript 化。`<script setup lang="ts">` + Composition API
- 計算を純粋関数に切り出す
  - `src/utils/tax.ts`: 標準報酬月額・所得税・給与所得控除・漢数字表記
  - `src/utils/simulate.ts`: 年収 → 全表示値（旧 `Tax.vue` の `change()`）
  - `src/utils/donut.ts`: ドーナツグラフの各セグメント（旧 `circle.vue` の methods）
- `watch` + 代入で状態を更新していた形を `computed` に置き換える
- ESLint 9 以降の flat config（`eslint.config.js`）+ `typescript-eslint` + `eslint-plugin-vue` + Prettier
- vitest で `test/` 以下をテストし、GitHub Actions で format チェック / lint / typecheck / test / build を回す
- 未使用の `HelloWorld.vue`、`babel.config.js`、`postcss.config.js`、`.eslintrc.js`、`.browserslistrc` を削除

## 守ること

- 計算結果は一切変えない。給与所得控除を標準報酬月額に掛けている点など、旧実装の癖もそのまま残す
- 旧実装を作業用に保存し、新実装と生成した年収で突き合わせて全一致を確認する。生成器と性質は恒久テストとして残す

## 依存のバージョン

- `typescript` は `~6.0` に固定する。`typescript-eslint` 8 系の対応範囲が `<6.1.0` のため

## 対象外

- 税率・制度の最新化、Google Analytics（UA）の置き換え
