(function(){
  const sb=window.designeSupabase;
  const path=location.pathname;
  const isLogin=/\/admin\/login\.html$/.test(path) || path.endsWith("/admin/login.html");
  async function isAdmin(){
    if(!sb) return false;
    const {data:{session}}=await sb.auth.getSession();
    if(!session) return false;
    const {data,error}=await sb.from("admin_users").select("user_id").eq("user_id",session.user.id).maybeSingle();
    return !error && !!data;
  }
  window.designeRequireAdmin=async function(){
    if(!sb){ if(!isLogin) location.href="login.html"; return null; }
    const ok=await isAdmin();
    if(!ok){ if(!isLogin) location.href="login.html"; return null; }
    return (await sb.auth.getSession()).data.session;
  };
  if(sb){
    sb.auth.onAuthStateChange((_event,session)=>{
      if(isLogin && session){ isAdmin().then(ok=>{if(ok) location.href="index.html";}); }
    });
  }
  window.designeIsAdmin=isAdmin;
})();
