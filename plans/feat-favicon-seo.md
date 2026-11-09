# ファビコンと検索エンジン向けの設定（#58）

## 方針

- ファビコンは Vue のロゴから、アクセント色の角丸に白い「税」へ置き換える。`scripts/make-images.sh` で再生成できるようにする
- iPhone のホーム画面用アイコンは端末側で角を丸め、透明な角は黒くなるので角丸なしにする
- 両ページに description・canonical・theme-color・OGP（画像つき）・Twitter カード（大きい画像）・構造化データ（WebApplication）を入れる
- 共有画像はページごとに作る（`/og-image.png`、`/furusato/og-image.png`）
- `robots.txt` と `sitemap.xml` を `public/` に置く
- 本体の `<noscript>` の英文を日本語にする

## 確認

- `yarn build` 後の `dist/` に画像・robots・sitemap が入ること
- `yarn preview` で全ファイルが 200 を返し、両ページが描画されること
