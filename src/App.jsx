import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  Trophy, Users, Swords, Bell, LogOut, Plus, Send, Check, X,
  Coins, Crown, Shield, Zap, RefreshCw, ChevronRight, CircleUserRound
} from "lucide-react";

const THEMES = [
  { id: "football", name: "Fußball-Legenden", emoji: "⚽", desc: "Prime, Ikonen und Weltstars", color: "green" },
  { id: "basketball", name: "Basketball", emoji: "🏀", desc: "NBA-Legenden und Superstars", color: "orange" },
  { id: "anime", name: "Anime-Universum", emoji: "🌌", desc: "Die stärksten Anime-Figuren", color: "purple" },
  { id: "heroes", name: "Superhelden", emoji: "🦸", desc: "Helden und Bösewichte", color: "blue" },
  { id: "cars", name: "Traumautos", emoji: "🏎️", desc: "Hypercars und Klassiker", color: "red" },
  { id: "animals", name: "Tierreich", emoji: "🦁", desc: "Land, Luft und Wasser", color: "gold" },
  { id: "gaming", name: "Gaming-Charaktere", emoji: "🎮", desc: "Ikonen aus Games", color: "cyan" },
  { id: "music", name: "Musik-Legenden", emoji: "🎤", desc: "Künstler und Bands", color: "pink" }
];

const FOOTBALL = [
  ["gk","Manuel Neuer","TW",96],["gk","Gianluigi Buffon","TW",95],["gk","Iker Casillas","TW",95],["gk","Lev Yashin","TW",97],
  ["def","Paolo Maldini","ABW",98],["def","Sergio Ramos","ABW",96],["def","Roberto Carlos","ABW",95],["def","Franz Beckenbauer","ABW",98],["def","Cafu","ABW",95],["def","Virgil van Dijk","ABW",94],
  ["mid","Zinedine Zidane","MF",98],["mid","Ronaldinho","MF",97],["mid","Andrés Iniesta","MF",96],["mid","Xavi","MF",96],["mid","Luka Modrić","MF",95],["mid","Diego Maradona","MF",99],["mid","Johan Cruyff","MF",98],
  ["att","Pelé","ST",99],["att","Cristiano Ronaldo","ST",98],["att","Lionel Messi","ST",99],["att","Ronaldo Nazário","ST",98],["att","Thierry Henry","ST",96],["att","Kylian Mbappé","ST",95],["att","Erling Haaland","ST",94]
].map((p,i)=>({key:"fb"+i,group:p[0],name:p[1],role:p[2],rating:p[3]}));

const GENERIC = {
  basketball: ["Michael Jordan","LeBron James","Kobe Bryant","Shaquille O'Neal","Stephen Curry","Magic Johnson","Larry Bird","Tim Duncan","Kareem Abdul-Jabbar","Kevin Durant","Giannis Antetokounmpo","Nikola Jokić","Allen Iverson","Hakeem Olajuwon"],
  anime: ["Son Goku","Vegeta","Naruto Uzumaki","Sasuke Uchiha","Monkey D. Luffy","Roronoa Zoro","Saitama","Gojo Satoru","Ichigo Kurosaki","Eren Yeager","Tanjiro Kamado","Madara Uchiha","Levi Ackerman","Kakashi Hatake"],
  heroes: ["Spider-Man","Iron Man","Thor","Batman","Superman","Wonder Woman","Black Panther","Doctor Strange","Hulk","Captain America","Wolverine","Flash","Green Lantern","Deadpool"],
  cars: ["Bugatti Chiron","McLaren P1","Ferrari F40","Porsche 911 GT3 RS","Lamborghini Aventador","Mercedes AMG One","Koenigsegg Jesko","Nissan GT-R R34","Toyota Supra MK4","Porsche 918 Spyder","Pagani Huayra","Ford GT"],
  animals: ["Afrikanischer Elefant","Löwe","Tiger","Gepard","Weißer Hai","Orca","Adler","Gorilla","Eisbär","Wolf","Krokodil","Falke","Blauwal","Schneeleopard"],
  gaming: ["Mario","Sonic","Master Chief","Lara Croft","Kratos","Link","Pikachu","Steve","Geralt von Riva","Kirby","Samus Aran","Scorpion","Ezio Auditore","Pac-Man"],
  music: ["Michael Jackson","Freddie Mercury","Beyoncé","Eminem","Taylor Swift","Prince","Whitney Houston","Elvis Presley","David Bowie","Adele","Bob Marley","Madonna","The Weeknd","Rihanna"]
};

const ROLE_SETS = {
  football: ["Torwart","Abwehr","Abwehr","Mittelfeld","Mittelfeld","Mittelfeld","Sturm"],
  basketball: ["Point Guard","Shooting Guard","Small Forward","Power Forward","Center","Sixth Player","All-Star"],
  anime: ["Anführer","Kämpfer","Kämpfer","Magier","Tank","Support","Ass"],
  heroes: ["Anführer","Kraft","Technik","Geschwindigkeit","Verteidigung","Support","Wildcard"],
  cars: ["Hypercar","Sportwagen","Klassiker","Rennwagen","Supercar","JDM","Wildcard"],
  animals: ["Land","Land","Luft","Luft","Wasser","Wasser","Wildcard"],
  gaming: ["Anführer","Kämpfer","Abenteurer","Magie","Technik","Support","Wildcard"],
  music: ["Stimme","Stimme","Rap","Pop","Rock","Legende","Wildcard"]
};

const makePool = (theme) => {
  if (theme === "football") return FOOTBALL;
  return (GENERIC[theme] || []).map((name,i)=>({key:theme+i,group:"all",name,role:ROLE_SETS[theme][i % ROLE_SETS[theme].length],rating:99-i*2}));
};
const makeEmail = (name) => name.trim().toLowerCase() + "@users.legenddraft.app";
const money = (n) => Number(n || 0).toFixed(0) + " €";
const initials = (name="?") => name.split(" ").slice(0,2).map(x=>x[0]).join("").toUpperCase();
const shuffle = (list) => [...list].sort(()=>Math.random()-.5);

export default function App() {
  const [session,setSession] = useState(null);
  const [profile,setProfile] = useState(null);
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [mode,setMode] = useState("login");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const [online,setOnline] = useState([]);
  const [requests,setRequests] = useState([]);
  const [invites,setInvites] = useState([]);
  const [theme,setTheme] = useState("football");
  const [gameId,setGameId] = useState(null);
  const [game,setGame] = useState(null);
  const [members,setMembers] = useState([]);
  const [picks,setPicks] = useState([]);
  const [bids,setBids] = useState([]);
  const [history,setHistory] = useState([]);
  const [tab,setTab] = useState("lobby");
  const [selectedUser,setSelectedUser] = useState("");
  const [bidValue,setBidValue] = useState(1);

  const me = session?.user;
  const currentTheme = THEMES.find(t=>t.id===game?.theme) || THEMES[0];
  const pool = useMemo(()=>makePool(game?.theme || theme),[game?.theme,theme]);
  const activePlayer = pool.find(p=>p.key===game?.current_player_key);
  const myMember = members.find(m=>m.user_id===me?.id);
  const opponent = members.find(m=>m.user_id!==me?.id);
  const myPicks = picks.filter(p=>p.user_id===me?.id);
  const opponentPicks = picks.filter(p=>p.user_id!==me?.id);
  const slots = ROLE_SETS[game?.theme || theme] || ROLE_SETS.football;

  const loadProfile = useCallback(async (user) => {
    if (!user) return;
    const {data,error} = await supabase.from("draft_profiles").select("*").eq("user_id",user.id).maybeSingle();
    if (error) setMessage(error.message);
    setProfile(data);
  },[]);

  const loadLobby = useCallback(async () => {
    if (!me) return;
    const [r,i,h] = await Promise.all([
      supabase.from("draft_friend_requests").select("id,sender_id,receiver_id,status,created_at").eq("receiver_id",me.id).eq("status","pending").order("created_at",{ascending:false}),
      supabase.from("draft_game_invites").select("id,game_id,sender_id,receiver_id,status,created_at").eq("receiver_id",me.id).eq("status","pending").order("created_at",{ascending:false}),
      supabase.from("draft_games").select("id,theme,status,created_at,created_by").eq("created_by",me.id).order("created_at",{ascending:false}).limit(12)
    ]);
    setRequests(r.data||[]); setInvites(i.data||[]); setHistory(h.data||[]);
  },[me]);

  const loadGame = useCallback(async (id) => {
    if (!id || !me) return;
    const [g,m,p,b] = await Promise.all([
      supabase.from("draft_games").select("*").eq("id",id).single(),
      supabase.from("draft_game_members").select("*").eq("game_id",id),
      supabase.from("draft_picks").select("*").eq("game_id",id).order("slot_index"),
      supabase.from("draft_bids").select("*").eq("game_id",id).order("created_at",{ascending:false}).limit(20)
    ]);
    if (g.error) { setMessage(g.error.message); return; }
    setGame(g.data); setMembers(m.data||[]); setPicks(p.data||[]); setBids(b.data||[]);
  },[me]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if (!me) { setProfile(null); return; }
    loadProfile(me); loadLobby();
    const channel=supabase.channel("legend-draft-presence",{config:{presence:{key:me.id}}});
    channel.on("presence",{event:"sync"},()=>{
      const state=channel.presenceState();
      const list=Object.values(state).flat().filter(p=>p.user_id!==me.id);
      setOnline(list);
    }).subscribe(async status=>{
      if(status==="SUBSCRIBED") {
        const {data}=await supabase.from("draft_profiles").select("username").eq("user_id",me.id).maybeSingle();
        await channel.track({user_id:me.id,username:data?.username||username||"Spieler",online_at:new Date().toISOString()});
      }
    });
    const inbox=supabase.channel("legend-draft-inbox-"+me.id)
      .on("postgres_changes",{event:"*",schema:"public",table:"draft_friend_requests",filter:"receiver_id=eq."+me.id},loadLobby)
      .on("postgres_changes",{event:"*",schema:"public",table:"draft_game_invites",filter:"receiver_id=eq."+me.id},loadLobby)
      .subscribe();
    return ()=>{supabase.removeChannel(channel);supabase.removeChannel(inbox);};
  },[me,loadProfile,loadLobby,username]);

  useEffect(()=>{
    if(!gameId || !me) return;
    loadGame(gameId);
    const channel=supabase.channel("legend-game-"+gameId)
      .on("postgres_changes",{event:"*",schema:"public",table:"draft_games",filter:"id=eq."+gameId},()=>loadGame(gameId))
      .on("postgres_changes",{event:"*",schema:"public",table:"draft_game_members",filter:"game_id=eq."+gameId},()=>loadGame(gameId))
      .on("postgres_changes",{event:"*",schema:"public",table:"draft_picks",filter:"game_id=eq."+gameId},()=>loadGame(gameId))
      .on("postgres_changes",{event:"*",schema:"public",table:"draft_bids",filter:"game_id=eq."+gameId},()=>loadGame(gameId))
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[gameId,me,loadGame]);

  async function authenticate(e) {
    e.preventDefault(); setMessage("");
    const clean=username.trim().toLowerCase();
    if(!/^[a-z0-9_]{3,20}$/.test(clean)) return setMessage("Name: 3–20 Zeichen, nur Buchstaben, Zahlen und _.");
    if(password.length<8) return setMessage("Dein Passwort muss mindestens 8 Zeichen haben.");
    setBusy(true);
    const result=mode==="signup"
      ? await supabase.auth.signUp({email:makeEmail(clean),password,options:{data:{username:clean}}})
      : await supabase.auth.signInWithPassword({email:makeEmail(clean),password});
    setBusy(false);
    if(result.error) return setMessage(result.error.message);
    if(mode==="signup" && !result.data.session) return setMessage("Account erstellt. Für den Start muss in Supabase unter Authentication → Providers → Email die E-Mail-Bestätigung ausgeschaltet sein, da du dich mit Benutzername anmeldest.");
    setSession(result.data.session);
    setMessage(mode==="signup"?"Account erstellt!":"Willkommen zurück!");
  }

  async function logout(){ await supabase.auth.signOut(); setGameId(null);setGame(null);setSession(null); }

  async function sendFriendRequest(userId) {
    const {error}=await supabase.from("draft_friend_requests").insert({sender_id:me.id,receiver_id:userId});
    setMessage(error?error.message:"Freundschaftsanfrage gesendet.");
  }
  async function answerFriend(id,status) {
    const {error}=await supabase.from("draft_friend_requests").update({status}).eq("id",id);
    setMessage(error?error.message:"Anfrage beantwortet."); loadLobby();
  }

  async function createGame() {
    setBusy(true); setMessage("");
    const {data:g,error}=await supabase.from("draft_games").insert({theme,created_by:me.id,budget:20,status:"lobby"}).select().single();
    if(error){setBusy(false);return setMessage(error.message);}
    const {error:memberError}=await supabase.from("draft_game_members").insert({game_id:g.id,user_id:me.id,budget_left:20});
    setBusy(false);
    if(memberError) return setMessage(memberError.message);
    setGameId(g.id);setTab("game");setMessage("Lobby erstellt. Lade einen Freund ein!");
  }

  async function inviteToGame(userId) {
    if(!gameId) return;
    const {error}=await supabase.from("draft_game_invites").insert({game_id:gameId,sender_id:me.id,receiver_id:userId});
    setMessage(error?error.message:"Spieleinladung gesendet.");
  }
  async function answerInvite(invite,status) {
    const {error}=await supabase.from("draft_game_invites").update({status}).eq("id",invite.id);
    if(error) return setMessage(error.message);
    if(status==="accepted") {
      const {error:joinError}=await supabase.from("draft_game_members").insert({game_id:invite.game_id,user_id:me.id,budget_left:20});
      if(joinError) return setMessage(joinError.message);
      setGameId(invite.game_id);setTab("game");
    }
    loadLobby();
  }

  function chooseNextPlayer(themeId,slot) {
    const list=makePool(themeId);
    const used=picks.map(p=>p.player_key);
    const available=list.filter(p=>!used.includes(p.key));
    return (available.length?available:list)[Math.floor(Math.random()*(available.length||list.length))];
  }

  async function startDraft() {
    const first=chooseNextPlayer(game.theme,0);
    const {error}=await supabase.from("draft_games").update({status:"auction",current_slot:0,current_player_key:first.key,highest_bid:0,highest_bidder:null,turn_user_id:me.id}).eq("id",game.id);
    if(error) setMessage(error.message);
  }

  async function placeBid() {
    if(!game||!activePlayer||!myMember) return;
    const amount=Number(game.highest_bid||0)+1;
    if(game.turn_user_id && game.turn_user_id!==me.id) return setMessage("Warte, bis du an der Reihe bist.");
    if(amount>Number(myMember.budget_left)) return setMessage("Dafür reicht dein Budget nicht.");
    setBusy(true);
    const {error}=await supabase.from("draft_bids").insert({game_id:game.id,bidder_id:me.id,player_key:activePlayer.key,amount});
    if(!error) {
      const next=members.find(m=>m.user_id!==me.id)?.user_id||me.id;
      const {error:updateError}=await supabase.from("draft_games").update({highest_bid:amount,highest_bidder:me.id,turn_user_id:next}).eq("id",game.id);
      if(updateError) setMessage(updateError.message);
    } else setMessage(error.message);
    setBusy(false);loadGame(game.id);
  }

  async function passAuction() {
    if(!game||!activePlayer) return;
    if(game.turn_user_id && game.turn_user_id!==me.id) return setMessage("Warte, bis du an der Reihe bist.");
    const winner=game.highest_bidder;
    if(winner) {
      const winnerMember=members.find(m=>m.user_id===winner);
      const slot=picks.filter(p=>p.user_id===winner).length;
      const {error:pickError}=await supabase.from("draft_picks").insert({
        game_id:game.id,user_id:winner,slot_index:slot,position:activePlayer.role,
        player_key:activePlayer.key,player_name:activePlayer.name,rating:activePlayer.rating,
        paid:game.highest_bid,is_auto:false
      });
      if(pickError) return setMessage(pickError.message);
      const newBudget=Math.max(0,Number(winnerMember?.budget_left||0)-Number(game.highest_bid||0));
      await supabase.from("draft_game_members").update({budget_left:newBudget}).eq("game_id",game.id).eq("user_id",winner);
      if(newBudget===0 && slot<6) {
        const fillers=makePool(game.theme).filter(p=>!picks.some(x=>x.player_key===p.key)&&p.key!==activePlayer.key);
        const rows=Array.from({length:6-slot},(_,i)=>{
          const p=fillers[i%Math.max(1,fillers.length)]||{key:"auto"+i,name:"Wildcard",role:"Wildcard",rating:60};
          return {game_id:game.id,user_id:winner,slot_index:slot+1+i,position:p.role,player_key:p.key+"-auto-"+i,player_name:p.name,rating:Math.min(70,p.rating),paid:0,is_auto:true};
        });
        await supabase.from("draft_picks").insert(rows);
      }
    }
    const nextSlot=Number(game.current_slot||0)+1;
    if(nextSlot>=14) {
      await supabase.from("draft_games").update({status:"completed",current_slot:14,current_player_key:null,highest_bid:0,highest_bidder:null,turn_user_id:null}).eq("id",game.id);
      setMessage("Draft beendet! Vergleicht eure Teams.");
    } else {
      const next=chooseNextPlayer(game.theme,nextSlot);
      await supabase.from("draft_games").update({current_slot:nextSlot,current_player_key:next.key,highest_bid:0,highest_bidder:null,turn_user_id:members[0]?.user_id||me.id}).eq("id",game.id);
    }
    loadGame(game.id);
  }

  async function leaveGame(){setGameId(null);setGame(null);setTab("lobby");}
  const totalRating=(arr)=>arr.reduce((sum,p)=>sum+Number(p.rating||0),0);

  if(!session) return <main className="auth-screen"><div className="auth-glow"/><div className="auth-card">
    <div className="brand-mark"><span>LD</span></div><p className="eyebrow">THE ULTIMATE DRAFT ARENA</p>
    <h1>LEGEND <em>DRAFT</em></h1><p className="muted">Baue dein Team. Überbiete deine Freunde. Schreib Geschichte.</p>
    <div className="auth-tabs"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Anmelden</button><button className={mode==="signup"?"active":""} onClick={()=>setMode("signup")}>Account erstellen</button></div>
    <form onSubmit={authenticate} className="auth-form">
      <label>BENUTZERNAME<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="z. B. legend_10" autoComplete="username" required maxLength={20}/></label>
      <label>PASSWORT<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mindestens 8 Zeichen" autoComplete={mode==="signup"?"new-password":"current-password"} required minLength={8}/></label>
      <button className="primary full" disabled={busy}>{busy?"Einen Moment…":mode==="signup"?"Account erstellen":"Los geht's"} <ChevronRight size={18}/></button>
    </form>
    {message&&<p className="notice">{message}</p>}
    <p className="tiny">Dein Benutzername ist öffentlich sichtbar. Teile dein Passwort niemals.</p>
  </div></main>;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-icon">LD</span><span>LEGEND <b>DRAFT</b></span></div>
      <nav><button className={tab==="lobby"?"nav-active":""} onClick={()=>{setTab("lobby");setGameId(null);}}>Lobby</button><button className={tab==="game"?"nav-active":""} onClick={()=>setTab("game")} disabled={!gameId}>Spiel</button></nav>
      <div className="user-chip"><span className="online-dot"/><span>{profile?.username||username||"Spieler"}</span><button title="Abmelden" onClick={logout}><LogOut size={17}/></button></div>
    </header>
    {tab==="lobby" ? <main className="content">
      <section className="welcome"><div><p className="eyebrow">WILLKOMMEN IN DER ARENA</p><h1>Dein nächster <em>Draft.</em></h1><p className="muted">Fordere Freunde heraus und beweise, wer das bessere Team baut.</p></div><div className="welcome-badge"><Trophy size={27}/><span>20 €<small>STARTBUDGET</small></span></div></section>
      {message&&<div className="notice inline-notice">{message}</div>}
      <div className="dashboard-grid">
        <section className="panel theme-panel"><div className="section-head"><div><p className="eyebrow">01 / SPIELMODUS</p><h2>Wähle dein Thema</h2></div><span className="pill">8 THEMEN</span></div>
          <div className="theme-grid">{THEMES.map(t=><button key={t.id} className={"theme-card "+(theme===t.id?"selected":"")} onClick={()=>setTheme(t.id)}><span className={"theme-emoji "+t.color}>{t.emoji}</span><strong>{t.name}</strong><small>{t.desc}</small>{theme===t.id&&<span className="selected-mark"><Check size={13}/></span>}</button>)}</div>
          <button className="primary create-btn" onClick={createGame} disabled={busy}><Plus size={18}/> Neue Lobby erstellen <span>20 € Budget</span></button>
        </section>
        <section className="panel online-panel"><div className="section-head"><div><p className="eyebrow">02 / DEINE GEGNER</p><h2>Online-Spieler</h2></div><span className="online-count"><i/> {online.length} ONLINE</span></div>
          {online.length===0?<div className="empty-state"><Users size={28}/><strong>Noch niemand online</strong><small>Teile den Link mit Freunden und verabredet euch.</small></div>:<div className="online-list">{online.map(u=><div className="online-user" key={u.user_id}><span className="avatar">{initials(u.username)}</span><span className="online-name">{u.username}<small>Online</small></span><button className="icon-btn" onClick={()=>sendFriendRequest(u.user_id)} title="Freundschaftsanfrage"><Users size={16}/></button><button className="invite-btn" onClick={()=>setMessage("Erstelle zuerst eine Lobby, dann kannst du Spieler einladen.")}>Einladen</button></div>)}</div>}
          <div className="divider-line"/><div className="section-head compact"><h3><Bell size={16}/> Anfragen</h3><span className="pill">{requests.length+invites.length}</span></div>
          {invites.map(i=><div className="request-row" key={i.id}><span>🎮 Spieleinladung</span><div><button className="accept" onClick={()=>answerInvite(i,"accepted")}><Check size={15}/> Beitreten</button><button className="decline" onClick={()=>answerInvite(i,"declined")}><X size={15}/></button></div></div>)}
          {requests.map(r=><div className="request-row" key={r.id}><span>👤 Freundschaftsanfrage</span><div><button className="accept" onClick={()=>answerFriend(r.id,"accepted")}><Check size={15}/> Annehmen</button><button className="decline" onClick={()=>answerFriend(r.id,"declined")}><X size={15}/></button></div></div>)}
          {!requests.length&&!invites.length&&<p className="empty-small">Keine neuen Anfragen.</p>}
        </section>
      </div>
      <section className="panel history-panel"><div className="section-head"><div><p className="eyebrow">03 / DEIN PROFIL</p><h2>Deine Spiele</h2></div><span className="pill">LETZTE LOBBYS</span></div>
        {history.length? <div className="history-list">{history.map(h=><div className="history-row" key={h.id}><span className="history-icon">{THEMES.find(t=>t.id===h.theme)?.emoji||"🎯"}</span><div><strong>{THEMES.find(t=>t.id===h.theme)?.name||h.theme}</strong><small>{new Date(h.created_at).toLocaleDateString("de-DE")} · {h.status==="completed"?"Beendet":h.status==="auction"?"Läuft":"Lobby"}</small></div><span className={"status "+h.status}>{h.status==="completed"?"FERTIG":h.status==="auction"?"LIVE":"OFFEN"}</span></div>)}</div>:<div className="empty-small">Deine bisherigen Spiele erscheinen hier.</div>}
      </section>
    </main> : <main className="content game-content">
      {!gameId||!game?<div className="panel empty-game"><Swords size={32}/><h2>Kein Spiel geöffnet</h2><button className="primary" onClick={()=>setTab("lobby")}>Zur Lobby</button></div>:<>
        <div className="game-heading"><div><p className="eyebrow">{currentTheme.emoji} {currentTheme.name.toUpperCase()}</p><h1>Die Arena</h1><p className="muted">Beide Teams live im Blick · Spielcode {game.id.slice(0,6).toUpperCase()}</p></div><button className="secondary" onClick={leaveGame}>Lobby verlassen</button></div>
        <div className="game-toolbar"><div className="budget-box"><Coins/><span>Dein Budget<strong>{money(myMember?.budget_left)}</strong></span></div><div className="round-box"><span>RUNDE</span><strong>{Math.min(game.current_slot+1,14)} <small>/ 14</small></strong></div><div className="budget-box"><Crown/><span>Gegner<strong>{money(opponent?.budget_left)}</strong></span></div></div>
        {game.status==="lobby" ? <section className="panel start-panel"><div className="big-emoji">{currentTheme.emoji}</div><h2>Warte auf deinen Gegner</h2><p className="muted">{members.length}/2 Spieler sind in der Lobby.</p><div className="member-chips">{members.map(m=><span key={m.user_id}>{m.user_id===me.id?"Du": "Mitspieler"} <i/></span>)}</div>{game.created_by===me.id&&members.length>=2&&<button className="primary" onClick={startDraft}><Zap size={18}/> Draft starten</button>}{members.length<2&&<p className="tiny">Gehe zurück zur Lobby und lade einen Online-Spieler ein.</p>}</section>
        : game.status==="completed" ? <section className="panel result-panel"><Trophy size={40}/><p className="eyebrow">DRAFT ABGESCHLOSSEN</p><h2>Das sind eure Teams.</h2><div className="team-columns"><Team title="DEIN TEAM" picks={myPicks} slots={slots} score={totalRating(myPicks)}/><Team title="GEGNER" picks={opponentPicks} slots={slots} score={totalRating(opponentPicks)}/></div><button className="primary" onClick={()=>setTab("lobby")}>Zurück zur Lobby</button></section>
        : <><section className="auction-panel panel"><div className="auction-top"><div><p className="eyebrow">JETZT IN DER AUKTION</p><h2>{activePlayer?.name||"Nächster Spieler"}</h2><p className="muted">{activePlayer?.role} · Stärke {activePlayer?.rating||"—"}</p></div><div className="player-rating">{activePlayer?.rating||"—"}<small>RATING</small></div></div><div className="auction-bid"><span>HÖCHSTGEBOT</span><strong>{money(game.highest_bid)}</strong><small>{game.highest_bidder===me.id?"Du führst":game.highest_bidder?"Gegner führt":"Noch kein Gebot"}</small></div><div className="auction-actions"><button className="primary bid-button" onClick={placeBid} disabled={busy||game.turn_user_id!==me.id||!activePlayer||Number(myMember?.budget_left||0)<Number(game.highest_bid||0)+1}><Coins size={18}/> {money(Number(game.highest_bid||0)+1)} bieten</button><button className="secondary" onClick={passAuction} disabled={busy||game.turn_user_id!==me.id}>Passen / aufgeben</button></div><p className="turn-hint">{game.turn_user_id===me.id?"Du bist dran!": "Der andere Spieler ist am Zug."}</p></section>
          <div className="team-columns"><Team title="DEIN TEAM" picks={myPicks} slots={slots} score={totalRating(myPicks)}/><Team title="GEGNER-TEAM" picks={opponentPicks} slots={slots} score={totalRating(opponentPicks)}/></div>
          <section className="panel bid-feed"><div className="section-head compact"><h3><Zap size={16}/> Letzte Gebote</h3><button className="text-btn" onClick={()=>loadGame(game.id)}><RefreshCw size={14}/> Aktualisieren</button></div>{bids.slice(0,6).map(b=><div className="bid-row" key={b.id}><span>{b.bidder_id===me.id?"Du":"Gegner"}</span><strong>{money(b.amount)}</strong><small>{b.player_key===activePlayer?.key?"Aktueller Spieler":"Spieler"}</small></div>)}{!bids.length&&<p className="empty-small">Noch keine Gebote.</p>}</section>
        </>}
      </>}
    </main>}
    <footer className="footer"><span>LEGEND DRAFT © 2026</span><span>BUILD YOUR LEGACY <b>✦</b></span></footer>
  </div>;
}

function Team({title,picks,slots,score}) {
  return <section className="team-panel panel"><div className="team-title"><h3>{title}</h3><span>{score} PTS</span></div><div className="team-list">{slots.map((role,i)=>{const p=picks.find(x=>x.slot_index===i);return <div className={"team-slot "+(p?"filled":"")} key={i}><span className="slot-number">{String(i+1).padStart(2,"0")}</span><span className="slot-avatar">{p?initials(p.player_name):"＋"}</span><span className="slot-info"><strong>{p?.player_name||"Freier Platz"}</strong><small>{p?.position||role}{p?.is_auto?" · AUTO":""}</small></span>{p&&<b className="slot-rating">{p.rating}</b>}</div>})}</div><div className="team-footer"><span>{picks.length}/7 Spieler</span><span>{picks.filter(p=>p.is_auto).length} Auto-Füller</span></div></section>;
}