# ふるさと納税の上限計算ページを /furusato/ として取り込む (#10)

- Vite の `build.rolldownOptions.input` に `furusato/index.html` を足し、2つ目の入口にする
- 元の HTML の `compute()` を `src/utils/furusato.ts` の `computeFurusatoLimit` に移す。計算・表・文言・スタイルは変えない
- 元の HTML の `compute()` を文字列で切り出してそのまま実行し、生成した入力で新実装と全項目を突き合わせる（使い捨て）
- 恒久テストは手計算した期待値と、各分岐（調整控除の3通り、上書き入力、判定所得の差額）を書く
- 基礎控除が令和7年分のままなのは、次の PR で令和8年分にして本体と表を共有する
