# Tax Simulator

https://tax-answer.net/#4000000

# About

年収額からおおよその納税額や社会保険の費用をシミュレートします。
会社員を想定していて、社会保険は厚生年金/保険で会社負担含めて、グラフで可視化しています。
税率・保険料率・控除額は令和8年分（2026年）、歳出の内訳は令和8年度補正後予算のものです。健康保険料は協会けんぽの全国平均で計算しています。国民健康保険・国民年金に切り替えた場合、国民健康保険料は東京23区の共通基準（加入者は本人1人）で計算します。

各種計算はこちら。

- 年収から各表示値まで: [`src/utils/simulate.ts`](src/utils/simulate.ts)
- 標準報酬月額・所得税・給与所得控除: [`src/utils/tax.ts`](src/utils/tax.ts)

## ふるさと納税の上限計算（個人事業主向け）

`/furusato/` で、売上・必要経費・青色申告特別控除などから、ふるさと納税の控除上限額の目安を計算します。計算は [`src/utils/furusato.ts`](src/utils/furusato.ts)。

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
