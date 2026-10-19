/* S20 user-approved story revision, 2026-10-15.
 * Source: outputs/scenario/doyun-heroine-centered-synopsis-script-v2-2026-10-15.md
 * Previous deployed text: outputs/scenario/pre-s20-story.js
 * Memory IDs retain their save-game meanings; memories can be found in any order.
 */
const storyLine=(speaker,text,memory=null)=>[speaker,text,{memory}];
window.STORY={
 studio:[
  storyLine('', '다음 칸은 작은 작업실이다. 흩어직 악보와 녹음기가 아직 그 자리에 있다.'),
  storyLine('도윤','여기서 마지막 노래를 만들고 있었어요. 어디서부터 찾아야할지 모르겠네요.'),
  storyLine('나','하나씩 찾아볼게요.'),
 ],
 laugh:[
  storyLine('','서랍 안에 구겨진 악보가 있다. 맨 위에는 ‘내일의 너에게 작은 위로를 전하는 노래’라고 적혀 있다.', 'laugh'),
  storyLine('도윤 · 기억','얼굴도 모르는 사람을 위해 노래를 만든다는 게 웃기지.','laugh'),
  storyLine('도윤 · 기억','그래도 누군가는 이 곡이 희망이 될 수 있지 않을까.','laugh'),
  storyLine('도윤 · 기억','그랬으면 좋겠다. 내 곡을 듣고 위로가 되길.','laugh'),
  storyLine('','도윤은 악보 한 귀퉁이에 멜로디 몇 음을 적는다.','laugh'),
  storyLine('도윤','이건 처음 쓴 부분이에요. 결국 제일 오래 남았네요.'),
 ],
 concert:[
  storyLine('','작은 공연 안내장. 날짜 아래에 남은 표가 여러 장 붙어 있다.','concert'),
  storyLine('도윤 · 기억','와 준 사람보다 빈 자리가 더 많네.','concert'),
  storyLine('','도윤은 객석을 다시 보지 않고 기타 줄을 고쳐 잡는다.','concert'),
  storyLine('도윤 · 기억','한 명이라도 듣고 있으면, 끝까지 해야지.','concert'),
  storyLine('','공연이 끝난 밤, 도윤은 첫 앨범의 노래를 영상으로 올린다.','concert'),
  storyLine('도윤','그때는 올리기만 하면 어떻게든 될 줄 알았어요.'),
 ],
 doubt:[
  storyLine('','모니터에는 도윤의 영상이 열려 있다. 조회수는 31회.','doubt'),
  storyLine('도윤 · 기억','앨범도 거의 안 팔렸고… 영상 조회수도 여기서 멈췄어.','doubt'),
  storyLine('도윤 · 기억','다음 곡까지 아무도 안 들으면 어떡하지?','doubt'),
  storyLine('','도윤은 녹음 버튼 앞에서 오래 멈춰 있다가 눈가를 훔친다.','doubt'),
  storyLine('도윤 · 기억','그런데 그만두고 싶지는 않아. 아직도 노래 만드는 게 좋아.','doubt'),
  storyLine('','도윤은 건반 하나를 눌러 새 노래의 첫 음을 찾는다.','doubt'),
  storyLine('도윤','저는 조회수 31을 ‘겨우’라고 생각했어요.'),
 ],
 nextSong:[
  storyLine('','컴퓨터에는 같은 곡의 파일이 여러 개 있다. 이름 뒤에 날짜와 ‘다시’가 반복된다.','nextSong'),
  storyLine('도윤 · 기억','첫 소절은 괜찮은데, 자꾸 마지막에서 진행이 안돼.','nextSong'),
  storyLine('','도윤은 숨을 고르고 노래한다. 목소리가 갈라지자 녹음을 멈춘다.','nextSong'),
  storyLine('도윤 · 기억','내일 다시 하자. 내일은 좀 나아지겠지.','nextSong'),
  storyLine('도윤','그 ‘내일’이 오면 다 괜찮아질 줄 알았어요.'),
 ],
 chair:[
  storyLine('','의자 한쪽 다리가 흔들린다. 작업하던 사람들이 이곳에 오래 앉아 있었던 흔적이다.'),
  storyLine('도윤','가끔 같이 작업하던 친구가 이 의자에 앉아 제 노래를 들어 주곤 했어요. 지금은 그때보다 노래가 더 낯설게 들리네요.'),
 ],
 medicine:[
  storyLine('','이름이 지워진 약 봉투가 책상 밑에 놓여 있다.'),
  storyLine('도윤','그때는 자꾸 모든 걸 내일로 미뤘어요.'),
 ],
 computerLocked:[
  storyLine('','컴퓨터에 여러 버전의 녹음이 있다. 맨 아래 파일은 아직 열리지 않는다.'),
  storyLine('','먼저 작업실에 남은 네 기억을 살펴봐야 할 것 같다.'),
 ],
};
