/* S20 user-approved main-scene revision, 2026-10-15.
 * Source: outputs/scenario/doyun-heroine-centered-synopsis-script-v2-2026-10-15.md
 * Previous deployed text: outputs/scenario/pre-s20-s17-story-data.js
 * Kept as S17_SCENES to preserve the game controller and existing saves.
 */
const sceneLine=(id,speaker,text,memory=null,cueAfter=null)=>[speaker,text,{id,memory,...(cueAfter?{cueAfter}:{})}];
window.S17_SCENES={
 intro:[
  sceneLine('01-01','','눈을 뜨니 열차 안이다. 어디서 탔는지는 기억나지 않는다.'),
  sceneLine('01-02','','창밖에는 아무것도 보이지 않는다.',null,'blackWindowMotif'),
  sceneLine('01-04','','앞쪽 창가에 한 청년이 앉아 있다.'),
 ],
 windowInitial:[
  sceneLine('01-W1','','창에 가까이 다가가도 내 모습은 비치지 않는다.'),
 ],
 windowInitialCloseup:[
  sceneLine('01-W2','','유리창에 손을 대자, 익숙한 눈빛이 나를 마주 본다.'),
  sceneLine('01-W3','','처음 보는 얼굴인데, 왜 낯설지가 않을까.'),
 ],
 meet:[
  sceneLine('02-01','도윤','혹시 녹음기 소리 들렸어요?'),
  sceneLine('02-02','나','음악이요?'),
  sceneLine('02-03','도윤','네. 제가 만든 거예요. '),
  sceneLine('02-04','나','작곡가인가요?'),
  sceneLine('02-05','도윤','무명 가수에요. 이렇게 말하면 좀 멋있어 보이려나.'),
  sceneLine('02-06','도윤','사실 제 노래를 기억하는 사람은 없을 거예요.',null,'glassFracture'),
  sceneLine('02-07','','방금… 내가 뭘 본 거지?'),
  sceneLine('02-08','도윤','아, 괜히 그런 말을 했네요. 잠깐 들어 볼래요?',null,'unfinishedMotif'),
  sceneLine('02-10','나','… 뒤가 있었던 것 같은데.'),
  {id:'02-CHOICES',memory:null,choices:[
   ['잔잔해서 좋네요.','고마워요. 그렇게 말해 주니 기분 좋네요.'],
   ['뒤가 더 있을 것 같아요.','그렇죠. 저도 그 뒷 부분을 찾고 있어요.'],
   ['직접 만든 곡이에요?','네. 아직 끝까지 만들지는 못했지만요.'],
  ]},
  sceneLine('02-11','도윤','뒷 부분을 찾고 있어요. 다음 칸에 작업실이 있거든요. 같이 가줄래요?'),
  sceneLine('02-12','나','같이 가요.'),
 ],
 final:[
  sceneLine('04-01','','폴더 맨 아래에 마지막 녹음 하나가 남아 있다.'),
  sceneLine('04-03','나','들어볼게요.'),
  sceneLine('04-04','','마지막 녹음이 끊긴 뒤, 혼자 올라갔던 옥상이 떠오른다. 도윤은 난간 앞에서 한참 움직이지 못한다.','hospital'),
  sceneLine('04-05','도윤 · 기억','내일... 다시 녹음... 할 수 있을까?','hospital'),
  sceneLine('04-06','','도윤은 한참 아래를 내려다본다. 발끝은 난간 안쪽에 남아 있고, 기억은 그 자리에서 끊긴다.','hospital'),
  sceneLine('04-07','도윤','그때는 누가 내 노래를 듣겠냐는 생각만 했어요.'),
  sceneLine('04-08','도윤','저는 결국…… 제 삶도 스스로 끝냈어요.'),
  sceneLine('04-09','','말이 끊긴다. 창밖의 검은 유리만 잠시 보인다.'),
  sceneLine('04-10','도윤','다른 사람들을 위해, 삶을 위해 만든 곡인데. 제가 그러지 못했네요.'),
  sceneLine('04-11','나','…처음부터 같이 들어요.'),
 ],
 afterMontage:[
  sceneLine('05-01','나','그 노래…… 알아요.'),
  sceneLine('05-02','도윤','제 노래를요?'),
  sceneLine('05-03','나','네. 하지만 아직 제가 누구였는지 다 기억나지 않아요.'),
  sceneLine('05-04','도윤','그럼 열차로 돌아가 볼까요. 거기서 생각날지도 몰라요.'),
 ],
 revealStart:[
  sceneLine('06-01','','유리창에 조금 전의 빛이 남아 있다.',null,'elderlyReflection'),
 ],
 revealFinish:[
  sceneLine('06-03','','유리에 손을 대자, 낯선 주름 사이로 익숙한 눈빛이 나를 마주 본다.'),
  sceneLine('06-04','','그날 이후, 나는 그 곡을 듣고 희망을 얻었다.'),
  sceneLine('06-05','나','……이제 기억나요.'),
 ],
 revealEarly:[sceneLine('06-EARLY','도윤','저 창…… 이제 뭐가 보여요?')],
 revealRepeat:[sceneLine('06-REPEAT','','유리에는 이제 흰머리의 내가 비친다.')],
 finale:[
  sceneLine('07-01','나','당신 영상, 조회수가 서른한 번이었죠.'),
  sceneLine('07-02','도윤','네. 저는 그 숫자만 보고 있었어요.'),
  sceneLine('07-03','나','그중 한 번이 저였어요.'),
  sceneLine('07-04','나','그날은 정말 삶을 포기하려고 했어요. 그런데 당신 노래를 듣고 정신이 들었어요.'),
  sceneLine('07-05','나','‘여기서 끝내지 말자. 다시 살아 보자.’ 그렇게 마음먹고 일어나 문을 열었어요.'),
  sceneLine('07-06','나','그 뒤로 열심히 살았어요. 일을 하고, 사랑하고, 힘든 날에는 다시 일어났어요. 할머니가 될 만큼 오래요.'),
  sceneLine('07-07','도윤','……제 노래가 정말 도움이 됐어요?'),
  sceneLine('07-08','나','네. 당신은 모르고 있었겠지만, 그날 제게 닿았어요.'),
  sceneLine('07-09','도윤','서른한 번 중 그 한 번이……'),
  sceneLine('07-10','나','그날 당신 노래가 저를 일으켜 세웠어요. 덕분에 제가 살아간 수많은 내일이 생겼어요. 고맙다고 말하고 싶었어요.'),
  sceneLine('07-11','','도윤은 고개를 숙인다. 웃으려다 눈물이 난다. 음악은 잠깐 멈추고 열차 소리만 남는다.'),
  sceneLine('07-12','도윤','저는 몰랐지만… 결국 제 곡은 누군가의 위로가 되었군요.'),
  sceneLine('07-13','도윤','끝부분만…… 한 번 더 불러도 될까요?',null,'doyunLastPhrase'),
 ],
 afterClap:[
  sceneLine('07-15','도윤','……노래하길 잘했네요.'),
  sceneLine('07-16','도윤','들어 줘서 고마워요.'),
 ],
 empty:[
  sceneLine('08-01','','도윤이 앉았던 자리에는 녹음기가 남아 있다.'),
  sceneLine('08-02','','창에는 이제 내 모습이 비친다. 노래의 마지막 음은 객실 안에 남아 있다.'),
 ],
 cues:{
  blackWindowMotif:{source:'01-03',description:'검은 창과 짧은 기타 멜로디'},
  glassFracture:{source:'02-07',durationMs:1300,description:'첫 대화 중 유리 균열에 도윤의 「아무도 듣지 않잖아.」 기억 컷이 끼어든다'},
  unfinishedMotif:{source:'02-09',description:'기타 한 소절이 중간에 끊긴다'},
  lifeMontage:{source:'SCENE05',durationMs:7400,description:'열차 창틀 없이 전체 화면에 주인공의 삶이 빠르게 스친다. 공개곡 재생 수가 30에서 31로 오른다. 주인공 현재 얼굴은 숨긴다'},
  elderlyReflection:{source:'06-02',durationMs:1000,description:'할머니의 모습은 열차 창 반영에만 나타난다'},
  doyunLastPhrase:{source:'07-14',description:'마지막 한 소절 뒤 플레이어 박수 한 번 대기'},
  clap:{source:'SCENE07',prompt:'마지막 관객이 되어 주세요.',inputs:['click','touch','E','Enter','Space'],maxCount:1},
  endingDoor:{source:'08-03',description:'오른쪽 연결문 조사 시 데모 종료'},
 },
 memoryStages:[
  {count:1,toast:'멜로디가 남았다.',saturation:.65,music:'guitar'},
  {count:2,toast:'반주가 더해졌다.',saturation:.75,music:'guitar+accompaniment'},
  {count:3,toast:'희미한 목소리가 들린다.',saturation:.85,music:'guitar+accompaniment+faintVocalNoise'},
  {count:4,toast:'아직 끝나지 않은 코드가 남았다.',saturation:.92,music:'unfinishedChordTwice'},
 ],
 prompts:{fourMemoriesDone:'마지막 파일을 들을 수 있다.',montageDone:'노래가 완성되었다.',inspectWindow:'유리창을 살펴보세요',finalDoyunTalk:'도윤과 마지막으로 이야기하세요'},
};
