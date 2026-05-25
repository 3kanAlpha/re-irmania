# Database Schema
## public.users
- id: int8, identity
- created_at: timestamptz, not null
- user_uid: uuid, primary key
- nickname: text, not null
- profile_pic_url: text

## public.tournaments
登録されている大会一覧

- id: identity
- created_at
- name: text, not null
  - 大会の名前
- `desc`: text
  - 大会の説明文
- `game_title`: text, not null
  - 大会を開催するゲームタイトル名
- `song_title`: text, not null
  - 大会を開催する楽曲名
- `difficulty`: text, not null
  - 大会で使用する譜面難易度
- `open_until`: timestamptz, not null
  - 大会の終了時刻
- `passwd`: text
  - パスワード付きのプレイベート大会で設定されるSHA-256ハッシュ化パスワード
- `created_by`: uuid, foreign key to users.user_uid
  - 大会を作成したユーザーのUUID
- `asc_order`: bool
  - `true`に設定すると、スコアの値が小さい方が順位が高くなる大会にする
- `score_visible`: bool
  - 参加者が自分以外のユーザーが提出したスコアを閲覧できるか（大会開催期間中のみ）
- `open_since`: timestamptz, not null
  - 大会の開始時刻
- `extra_params`: jsonb
  - 特殊パラメータ
- `alt_rank`: bool
  - 順位付けの方法に関わる
- `hide_score_hr`: int2, not null
  - 0以上の値を設定すると、大会の開催終了n時間前から大会終了まで、参加者は自分以外のユーザーが提出したスコアを閲覧できなくなる

## public.scores
登録されているスコア一覧

- id: identity
- created_at
- tournament_id: int8, foreign key to tournaments.id
  - スコアを提出する大会のID
- `score`: float8, not null
  - スコア
- `updated_at`: timestamptz
- `image_url`: text
  - リザルト画像のURL
- `user_uid`: uuid, foreign key to users.user_uid
  - スコアを提出したユーザーのUUID
- `comment`: text
  - コメント（任意）
- `extra_params`: jsonb
  - 特殊パラメータだが、使用されていない
