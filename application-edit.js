'use strict';
// Authentication/session tokens remain in memory and are never placed in URLs or browser storage.
const editRequests = new Map();
const editFrame = document.createElement('iframe');
editFrame.name = 'application-edit-frame'; editFrame.title = '신청 수정 인증 처리'; editFrame.hidden = true; document.body.append(editFrame);
function editNode(tag, attrs = {}, text = '') {
  const n = document.createElement(tag); Object.entries(attrs).forEach(([k,v]) => n.setAttribute(k,v)); n.textContent = text; return n;
}
function editRpc(operation, values = {}) {
  return new Promise((resolve,reject) => {
    const nonce = crypto.randomUUID();
    const timer = setTimeout(() => { editRequests.delete(nonce); reject(new Error('응답이 지연됩니다. 저장을 요청했다면 다시 조회해 반영 여부를 먼저 확인해 주세요.')); }, 45000);
    editRequests.set(nonce, {resolve,reject,timer});
    fetch(CAMP_LOOKUP_URL,{method:'POST',body:new URLSearchParams({action:'application-edit',operation,nonce,transport:'json',...values}),credentials:'omit'}).then(response=>{if(!response.ok)throw new Error('edit_connection_failed');return response.json();}).then(data=>receiveEditResponse(data)).catch(()=>{const pending=editRequests.get(nonce);if(!pending)return;clearTimeout(pending.timer);editRequests.delete(nonce);pending.reject(new Error('연결에 실패했습니다. 저장을 요청했다면 다시 조회해 반영 여부를 확인해 주세요.'));});
  });
}
window.addEventListener('message', event => {
  if (!/^https:\/\/[a-z0-9-]+(?:-script|\.script)\.googleusercontent\.com$/.test(event.origin) && event.origin !== 'https://script.google.com') return;
  receiveEditResponse(event.data);
});
function receiveEditResponse(data){
  if (!data || data.type !== 'xmas-edit' || !editRequests.has(data.nonce)) return;
  const pending=editRequests.get(data.nonce); clearTimeout(pending.timer); editRequests.delete(data.nonce);
  if (data.ok) pending.resolve(data); else pending.reject(new Error(data.message || '처리할 수 없습니다. 잠시 후 다시 시도해 주세요.'));
}
function attachApplicationEditor(card, record, identity) {
  if (!record.editHandle) return;
  if (!record.canEdit) {
    card.append(editNode('p',{class:'fine-print'},'등록된 이메일이 없는 신청은 호캠프 Q&A 게시판으로 수정 문의해 주세요.'));
    return;
  }
  const open=editNode('button',{type:'button',class:'button lookup-link edit-open'},'신청 내용 수정하기 ↗'); card.append(open);
  open.addEventListener('click', () => {
    if (card.querySelector('.application-editor')) return;
    open.disabled=true;
    const panel=editNode('section',{class:'application-editor','aria-label':'이메일 인증 후 신청 수정'});
    const notice=editNode('p',{class:'field-description'},'신청할 때 등록한 이메일로 인증번호를 보내 본인을 확인합니다. 인증번호는 15분간 유효하며, 메일이 보이지 않으면 스팸함을 확인해 주세요.');
    const status=editNode('p',{class:'edit-status',role:'status','aria-live':'polite'});
    const send=editNode('button',{type:'button',class:'button lookup-link'},'이메일 인증번호 받기');
    const auth=editNode('form',{class:'edit-auth',hidden:''});
    const label=editNode('label',{},'이메일 인증번호');
    const code=editNode('input',{type:'text',inputmode:'numeric',pattern:'[0-9]{6}',maxlength:'6',required:'',autocomplete:'one-time-code','aria-label':'이메일 인증번호',placeholder:'숫자 6자리'});
    code.addEventListener('input',()=>{code.value=code.value.replace(/\D/g,'').slice(0,6);});
    const verify=editNode('button',{type:'submit',class:'button button-red submit-button'},'인증하고 수정하기');
    label.append(code);auth.append(label,verify);
    const close=editNode('button',{type:'button',class:'text-link'},'수정 닫기');
    let challenge='',session='',revision=0;
    close.addEventListener('click',()=>{session='';panel.remove();open.disabled=false;open.focus();});
    panel.append(editNode('h3',{},'이메일로 본인 확인'),notice,send,auth,status,close);card.append(panel);send.focus();
    send.addEventListener('click',async()=>{
      send.disabled=true;status.textContent='인증 메일을 요청하고 있습니다.';
      try {const data=await editRpc('request',{handle:record.editHandle,name:identity.name,phone:identity.phone});challenge=data.challenge;auth.hidden=false;status.textContent=data.message;send.textContent='인증번호 다시 받기';code.focus();}
      catch(error){status.textContent=error.message;}finally{send.disabled=false;}
    });
    auth.addEventListener('submit',async event=>{
      event.preventDefault();verify.disabled=true;status.textContent='인증번호를 확인하고 있습니다.';
      try {const data=await editRpc('verify',{challenge,code:code.value});session=data.session;revision=data.revision;auth.remove();send.remove();notice.textContent='인증이 완료되었습니다. 이메일과 기존 동의 내용은 유지됩니다. 이메일 변경은 호캠프 Q&A 게시판으로 문의해 주세요.';panel.querySelector('h3').textContent='신청 내용 수정';status.textContent=data.message;renderEditForm(panel,data.values,async values=>{
        const saved=await editRpc('save',{session,revision,values:JSON.stringify(values)});
        if(saved.unchanged)return saved;
        session='';document.getElementById('lookup-name').value=saved.name;document.getElementById('lookup-phone').value=saved.phone;
        const done=editNode('p',{class:'registration-note',role:'status'},`${saved.message}\n재계산 금액: ${Number(saved.amount).toLocaleString('ko-KR')}원\n${saved.paymentStatus}`);
        panel.replaceChildren(done);
        const refresh=editNode('button',{type:'button',class:'button lookup-link'},'수정한 신청 내역 다시 확인하기');refresh.addEventListener('click',()=>document.getElementById('lookup-form').requestSubmit());panel.append(refresh);return saved;
      },status,close);}
      catch(error){status.textContent=error.message;}finally{verify.disabled=false;}
    });
  });
}
function renderEditForm(panel, initial, save, status, close) {
  const form=editNode('form',{class:'edit-fields'}), controls=new Map();
  function addInput(labelText,id,type='text',options=null,required=false){
    const wrap=editNode('div',{class:'form-field'}),label=editNode('label',{},labelText);
    const input=editNode(options?'select':type==='textarea'?'textarea':'input',{'aria-label':labelText});
    if(!options&&type!=='textarea')input.type=type;
    if(required)input.required=true;
    if(options)options.forEach(value=>input.append(editNode('option',{value},value)));
    if(id===1239222796){input.inputMode='numeric';input.pattern='[0-9]{10,11}';input.maxLength=11;input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,11);});}
    if(id===710258770)input.maxLength=1500;
    if(type==='time')input.step=60;
    input.name=String(id);input.value=String(initial[id]??'');controls.set(String(id),input);label.append(input);wrap.append(label);form.append(wrap);return input;
  }
  registrationFields.forEach(question=>{
    const entry=question.entries[0],id=entry.id;
    if([1833005978,2000713890].includes(id))return;
    if(id===1244916950){const email=addInput('인증한 이메일 주소',id,'email');email.readOnly=true;email.disabled=true;return;}
    if(question.type===7){question.entries.forEach(e=>addInput(e.row,e.id,'text',e.options,true));return;}
    if(question.type===4){
      const wrap=editNode('fieldset',{class:'form-field'});wrap.append(editNode('legend',{},question.title));
      const selected=Array.isArray(initial[id])?initial[id]:[];
      entry.options.forEach(value=>{const label=editNode('label',{class:'choice'}),input=editNode('input',{type:'checkbox',name:String(id),value});input.checked=selected.includes(value);label.append(input,editNode('span',{},value));wrap.append(label);});form.append(wrap);return;
    }
    addInput(question.title,id,question.type===1?'textarea':question.type===10?'time':'text',[2,3].includes(question.type)?entry.options:null,entry.required);
    if(id===372074511)addInput('추가 차량 수 · 기본 1대 외',126976328,'text',['차량추가 없음 (기본 차량 1대)','1대 추가 (총 2대)','2대 추가 (총 3대)'],true);
  });
  const summary=editNode('section',{class:'amount-card'}),amount=editNode('output',{'aria-live':'polite'});
  summary.append(editNode('h3',{},'수정 후 입금 예정 금액'),amount,editNode('p',{class:'fine-print'},'성인 2명·아동 2명 기준입니다. 다자녀 면제는 자동 반영되지 않습니다. 기존 입금액보다 금액이 줄면 환불은 운영진 확인 후 처리합니다.'));
  const consent=editNode('p',{class:'fine-print'},'최초 신청 시 선택한 개인정보·촬영 동의 내용은 유지됩니다. 수정 내용은 시트에 반영하고 등록된 이메일로 안내합니다.');
  const submit=editNode('button',{type:'submit',class:'button button-red submit-button'},'변경 내용 저장하기');
  form.append(summary,consent,submit);panel.insertBefore(form,status);panel.append(close);
  function recalculate(){const options=registrationFields.find(q=>q.entries[0].id===1592266769).entries[0].options,index=options.indexOf(controls.get('1592266769').value);const includedPeople=index===3?4:2;const extraPeople=Math.max(0,Number(controls.get('1357739873').value)-includedPeople)+Math.max(0,Number(controls.get('1724175323').value)-includedPeople);const cars=Math.max(0,controls.get('126976328').selectedIndex-(index===3?1:0));amount.textContent=index<0?'숙소 선택 필요':(([180000,180000,190000,480000][index])+extraPeople*(index===3?20000:10000)+cars*10000).toLocaleString('ko-KR')+'원';}
  form.addEventListener('input',recalculate);form.addEventListener('change',recalculate);recalculate();
  form.addEventListener('submit',async event=>{
    event.preventDefault();submit.disabled=true;status.textContent='변경 내용을 저장하고 있습니다.';
    const values={};controls.forEach((input,id)=>{if(id!=='1244916950')values[id]=input.value.trim();});values['1741145555']=Array.from(form.querySelectorAll('input[type=checkbox]:checked'),input=>input.value);
    try{const result=await save(values);if(result.unchanged)status.textContent=result.message;}
    catch(error){status.textContent=error.message;}finally{submit.disabled=false;}
  });
}
