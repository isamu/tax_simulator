# Tax Simulator

https://tax-answer.net/#4000000

# About

年収額からおおよその納税額や社会保険の費用をシミュレートします。
会社員を想定していて、社会保険は厚生年金/保険で会社負担含めて、グラフで可視化しています。
税率等は2018年の物なので少し古いかもしれません。

各種計算はこちら。

- 年収から各表示値まで: [`src/utils/simulate.ts`](src/utils/simulate.ts)
- 標準報酬月額・所得税・給与所得控除: [`src/utils/tax.ts`](src/utils/tax.ts)

## 開発

Vue 3 + Vite + TypeScript。

```
yarn install
yarn dev          # 開発サーバー
yarn build        # dist/ に本番用ファイルを出力
yarn preview      # ビルド結果をローカルで確認
yarn test         # vitest
yarn lint         # ESLint
yarn typecheck    # vue-tsc
yarn format       # Prettier
```

`yarn build` で出力される `dist/` を公開先に配置します。
