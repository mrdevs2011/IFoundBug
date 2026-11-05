'use client';
import React, { useRef, useState } from 'react';
import { Modal, ErrorBox } from '@/components/ui';
import { Avatar, ghBtn, ghBtnPrimary, ghInput } from '@/components/gh';
import { errMsg, updateMyName, type Me } from '@/lib/db';
import { AVATAR_MAX_BYTES } from '@/lib/avatar';

export default function ProfileModal({ me, onClose, onSaved }: { me: Me; onClose: () => void; onSaved: (me: Me) => void }) {
  const [avatar, setAvatar] = useState<string | undefined>(me.avatar_url);
  const [name, setName] = useState(me.full_name);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Use a PNG, JPG or WebP image.'); return; }
    if (file.size > AVATAR_MAX_BYTES) { setError('Image must be at most 2 MB.'); return; }
    setBusy('upload');
    try {
      const body = new FormData(); body.append('file', file);
      const res = await fetch('/api/profile/avatar', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed.');
      setAvatar(json.avatar_url); onSaved({ ...me, full_name: name, avatar_url: json.avatar_url });
    } catch (e) { setError(errMsg(e)); } finally { setBusy(''); if (fileRef.current) fileRef.current.value = ''; }
  };
  const remove = async () => {
    setError(''); setBusy('remove');
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not remove the picture.');
      setAvatar(undefined); onSaved({ ...me, full_name: name, avatar_url: undefined });
    } catch (e) { setError(errMsg(e)); } finally { setBusy(''); }
  };
  const saveName = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy('name');
    try { await updateMyName(name); onSaved({ ...me, full_name: name.trim(), avatar_url: avatar }); onClose(); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(''); }
  };

  return (
    <Modal title="Edit profile" onClose={onClose}>
      <div className="flex items-center gap-4">
        <Avatar name={name || me.username} src={avatar} size={96} />
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          <button type="button" className={ghBtn} disabled={Boolean(busy)} onClick={() => fileRef.current?.click()}>{busy === 'upload' ? 'Uploading…' : 'Upload a photo…'}</button>
          {avatar && <button type="button" className={`${ghBtn} !text-[#f85149]`} disabled={Boolean(busy)} onClick={remove}>{busy === 'remove' ? 'Removing…' : 'Remove photo'}</button>}
          <p className="text-xs text-[#9198a1]">PNG, JPG or WebP, up to 2 MB.</p>
        </div>
      </div>
      <form onSubmit={saveName} className="mt-5 space-y-2 border-t border-[#3d444d] pt-4">
        <label className="block text-sm font-semibold text-[#f0f6fc]" htmlFor="profile-name">Name</label>
        <input id="profile-name" className={ghInput} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        <p className="text-xs text-[#9198a1]">Username @{me.username} cannot be changed.</p>
        {error && <ErrorBox message={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghBtn} onClick={onClose}>Cancel</button>
          <button className={ghBtnPrimary} disabled={Boolean(busy) || !name.trim() || name.trim() === me.full_name}>{busy === 'name' ? 'Saving…' : 'Update profile'}</button>
        </div>
      </form>
    </Modal>
  );
}
