import React, { useMemo, useState } from 'react';
import { Control, FieldErrors, UseFormRegister, UseFormWatch, useFieldArray } from 'react-hook-form';
import {
  X,
  Share2,
  MoreHorizontal,
  Search,
  Check,
  Trash2,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Video,
  Music2,
  Pin,
  MessageCircle,
  Github,
  BriefcaseBusiness,
  Dribbble,
  BookOpen,
  Twitch,
  Satellite,
  Camera,
  MessageSquareMore,
  CircleDot,
  Plus,
} from 'lucide-react';
import { BusinessFormValues } from '../../../types';

interface BusinessSocialLinksProps {
  control: Control<BusinessFormValues>;
  register: UseFormRegister<BusinessFormValues>;
  errors: FieldErrors<BusinessFormValues>;
  watch: UseFormWatch<BusinessFormValues>;
}

type PlatformDef = {
  name: string;
  icon: React.ReactNode;
  placeholder: string;
  urlHint?: string;
};

type PlatformAccent = {
  card: string;
  selected: string;
  bubble: string;
  plus: string;
};

type LinkDraft = {
  platform: string;
  url: string;
  iconKey?: string;
};

const DEFAULT_PLATFORMS: PlatformDef[] = [
  { name: 'LinkedIn', icon: <Linkedin className="h-4 w-4" />, placeholder: 'https://linkedin.com/company/yourbrand' },
  { name: 'Facebook', icon: <Facebook className="h-4 w-4" />, placeholder: 'https://facebook.com/yourbrand' },
  { name: 'Instagram', icon: <Instagram className="h-4 w-4" />, placeholder: 'https://instagram.com/yourbrand' },
  { name: 'YouTube', icon: <Youtube className="h-4 w-4" />, placeholder: 'https://youtube.com/@yourbrand' },
  { name: 'X (Twitter)', icon: <Twitter className="h-4 w-4" />, placeholder: 'https://x.com/yourbrand' },
];

const MORE_PLATFORM_OPTIONS: PlatformDef[] = [
  { name: 'X (Twitter)', icon: <Twitter className="h-4 w-4" />, placeholder: 'https://x.com/yourbrand' },
  { name: 'TikTok', icon: <Music2 className="h-4 w-4" />, placeholder: 'https://tiktok.com/@yourbrand' },
  { name: 'Pinterest', icon: <Pin className="h-4 w-4" />, placeholder: 'https://pinterest.com/yourbrand' },
  { name: 'Reddit', icon: <MessageCircle className="h-4 w-4" />, placeholder: 'https://reddit.com/user/yourbrand' },
  { name: 'Threads', icon: <CircleDot className="h-4 w-4" />, placeholder: 'https://threads.net/@yourbrand' },
  { name: 'Snapchat', icon: <Camera className="h-4 w-4" />, placeholder: 'https://snapchat.com/add/yourbrand' },
  { name: 'Telegram', icon: <MessageSquareMore className="h-4 w-4" />, placeholder: 'https://t.me/yourbrand' },
  { name: 'Discord', icon: <MessageSquareMore className="h-4 w-4" />, placeholder: 'https://discord.gg/yourbrand' },
  { name: 'GitHub', icon: <Github className="h-4 w-4" />, placeholder: 'https://github.com/yourbrand' },
  { name: 'Behance', icon: <BriefcaseBusiness className="h-4 w-4" />, placeholder: 'https://behance.net/yourbrand' },
  { name: 'Dribbble', icon: <Dribbble className="h-4 w-4" />, placeholder: 'https://dribbble.com/yourbrand' },
  { name: 'Medium', icon: <BookOpen className="h-4 w-4" />, placeholder: 'https://medium.com/@yourbrand' },
  { name: 'Vimeo', icon: <Video className="h-4 w-4" />, placeholder: 'https://vimeo.com/yourbrand' },
  { name: 'Twitch', icon: <Twitch className="h-4 w-4" />, placeholder: 'https://twitch.tv/yourbrand' },
  { name: 'Mastodon', icon: <Satellite className="h-4 w-4" />, placeholder: 'https://mastodon.social/@yourbrand' },
  { name: 'Flickr', icon: <Camera className="h-4 w-4" />, placeholder: 'https://flickr.com/photos/yourbrand' },
];

const CUSTOM_ICON_CHOICES = [
  { key: 'globe', icon: <Globe className="h-4 w-4" /> },
  { key: 'link', icon: <Share2 className="h-4 w-4" /> },
  { key: 'message', icon: <MessageCircle className="h-4 w-4" /> },
  { key: 'camera', icon: <Camera className="h-4 w-4" /> },
  { key: 'video', icon: <Video className="h-4 w-4" /> },
];

const PLATFORM_LOOKUP = new Map<string, PlatformDef>(
  [...DEFAULT_PLATFORMS, ...MORE_PLATFORM_OPTIONS].map((platform) => [platform.name.toLowerCase(), platform]),
);

const PLATFORM_ACCENTS: Record<string, PlatformAccent> = {
  linkedin: {
    card: 'border-[#C7D8F8] bg-[#F5F8FF]',
    selected: 'border-[#0A66C2] bg-[#EAF3FF] shadow-[0_8px_18px_rgba(10,102,194,0.16)]',
    bubble: 'border-[#B8D1F8] bg-[#EAF3FF] text-[#0A66C2]',
    plus: 'border-[#B8D1F8] text-[#0A66C2]',
  },
  facebook: {
    card: 'border-[#C9D9FF] bg-[#F5F8FF]',
    selected: 'border-[#1877F2] bg-[#EEF4FF] shadow-[0_8px_18px_rgba(24,119,242,0.16)]',
    bubble: 'border-[#BBD1FF] bg-[#EAF2FF] text-[#1877F2]',
    plus: 'border-[#BBD1FF] text-[#1877F2]',
  },
  instagram: {
    card: 'border-[#F3C5DA] bg-[#FFF7FB]',
    selected: 'border-[#D62976] bg-[#FFF0F6] shadow-[0_8px_18px_rgba(214,41,118,0.16)]',
    bubble: 'border-[#F1BCD4] bg-[#FFEAF3] text-[#D62976]',
    plus: 'border-[#F1BCD4] text-[#D62976]',
  },
  youtube: {
    card: 'border-[#FFD0D0] bg-[#FFF7F7]',
    selected: 'border-[#FF0000] bg-[#FFF0F0] shadow-[0_8px_18px_rgba(255,0,0,0.14)]',
    bubble: 'border-[#FFC5C5] bg-[#FFECEC] text-[#FF0000]',
    plus: 'border-[#FFC5C5] text-[#E00000]',
  },
  'x (twitter)': {
    card: 'border-slate-300 bg-slate-50',
    selected: 'border-slate-800 bg-slate-100 shadow-[0_8px_18px_rgba(15,23,42,0.14)]',
    bubble: 'border-slate-300 bg-white text-slate-900',
    plus: 'border-slate-300 text-slate-800',
  },
  more: {
    card: 'border-[#D9CCFF] bg-[#FAF8FF]',
    selected: 'border-[#7C3AED] bg-[#F3EEFF] shadow-[0_8px_18px_rgba(124,58,237,0.15)]',
    bubble: 'border-[#D6C6FF] bg-[#F1EBFF] text-[#7C3AED]',
    plus: 'border-[#D6C6FF] text-[#7C3AED]',
  },
};

const DEFAULT_PLATFORM_ACCENT: PlatformAccent = {
  card: 'border-slate-200 bg-white',
  selected: 'border-[#2563EB] bg-blue-50 shadow-[0_8px_18px_rgba(37,99,235,0.14)]',
  bubble: 'border-slate-200 bg-white text-slate-600',
  plus: 'border-slate-200 text-[#2563EB]',
};

function getPlatformAccent(platformName: string) {
  return PLATFORM_ACCENTS[normalize(platformName)] || DEFAULT_PLATFORM_ACCENT;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isValidUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

function IconBubble({ icon, accent, active = false }: { icon: React.ReactNode; accent?: PlatformAccent; active?: boolean }) {
  const platformAccent = accent || DEFAULT_PLATFORM_ACCENT;
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${active ? platformAccent.selected : platformAccent.bubble}`}
    >
      {icon}
    </span>
  );
}

export default function BusinessSocialLinks({ control, register, errors, watch }: BusinessSocialLinksProps) {
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: 'socialLinks',
  });

  const [showSummary, setShowSummary] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [customPlatformUrl, setCustomPlatformUrl] = useState('');
  const [customIconKey, setCustomIconKey] = useState('globe');
  const [formError, setFormError] = useState('');

  const socialEntries = fields.map((field, index) => ({
    id: field.id,
    platform: watch(`socialLinks.${index}.platform` as const) || field.platform || '',
    url: watch(`socialLinks.${index}.url` as const) || field.url || '',
    iconKey: watch(`socialLinks.${index}.iconKey` as const) || field.iconKey || '',
  }));

  const usedPlatforms = useMemo(
    () =>
      socialEntries
        .map((entry) => entry.platform)
        .filter(Boolean)
        .map((platform) => normalize(platform)),
    [socialEntries],
  );

  const visibleMorePlatforms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return MORE_PLATFORM_OPTIONS.filter((platform) => {
      const matchesSearch = !query || platform.name.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [search]);

  const getPlatformDefinition = (platformName: string) =>
    PLATFORM_LOOKUP.get(normalize(platformName)) || {
      name: platformName,
      icon: <Globe className="h-4 w-4" />,
      placeholder: 'https://example.com',
    };

  const addPlatform = (platform: PlatformDef) => {
    if (usedPlatforms.includes(normalize(platform.name))) return;
    append({ platform: platform.name, url: '' });
  };

  const openMoreModal = () => {
    setSearch('');
    setIsMoreModalOpen(true);
  };

  const openCustomModal = () => {
    setCustomPlatformName('');
    setCustomPlatformUrl('');
    setCustomIconKey('globe');
    setFormError('');
    setIsCustomModalOpen(true);
  };

  const handleAddCustomLink = () => {
    const platformName = customPlatformName.trim();
    const url = customPlatformUrl.trim();
    if (!platformName) {
      setFormError('Platform name is required.');
      return;
    }
    if (!isValidUrl(url)) {
      setFormError('Please enter a valid URL.');
      return;
    }
    if (usedPlatforms.includes(normalize(platformName))) {
      setFormError('That platform already exists.');
      return;
    }

    const iconKey = customIconKey || 'globe';
    append({ platform: platformName, url, iconKey });
    setIsCustomModalOpen(false);
    setFormError('');
  };

  const handleLinkChange = (index: number, patch: Partial<LinkDraft>) => {
    const current = fields[index] as unknown as LinkDraft;
    update(index, { ...current, ...patch } as never);
  };

  return (
    <div className="space-y-4" id="social-links-section">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3">
        <label className="inline-flex items-start gap-3 self-start">
          <input
            type="checkbox"
            checked={showSummary}
            onChange={(event) => setShowSummary(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2563EB] accent-[#2563EB] focus:ring-2 focus:ring-blue-200"
          />
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">
              Social Profiles <span className="font-medium text-slate-400">(Optional)</span>
            </h3>
            <p className="text-xs text-slate-500">Add links to your social media or other profiles.</p>
          </div>
        </label>
      </div>

      {showSummary ? (
        <>
          <div className="flex flex-wrap items-start gap-2" id="social-links-list">
            {DEFAULT_PLATFORMS.map((platform) => {
              const isAdded = usedPlatforms.includes(normalize(platform.name));
              const accent = getPlatformAccent(platform.name);
              return (
                <button
                  key={platform.name}
                  type="button"
                  onClick={() => addPlatform(platform)}
                  className={`flex w-[76px] flex-col items-center justify-center gap-2 rounded-[10px] border px-2 py-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(37,99,235,0.12)] ${isAdded ? accent.selected : accent.card}`}
                >
                  <IconBubble icon={platform.icon} accent={accent} active={isAdded} />
                  <span className="text-[11px] font-medium leading-tight text-slate-800">{platform.name}</span>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[12px] leading-none ${accent.plus}`}>
                    +
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={openMoreModal}
              className={`flex w-[76px] flex-col items-center justify-center gap-2 rounded-[10px] border px-2 py-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(124,58,237,0.12)] ${PLATFORM_ACCENTS.more.card}`}
            >
              <IconBubble icon={<MoreHorizontal className="h-4 w-4" />} accent={PLATFORM_ACCENTS.more} />
              <span className="text-[11px] font-medium leading-tight text-slate-800">More</span>
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[12px] leading-none ${PLATFORM_ACCENTS.more.plus}`}>
                <Plus className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>

          {fields.length > 0 ? (
            <div className="space-y-3">
              {fields.map((field, index) => {
                const platformName = watch(`socialLinks.${index}.platform` as const) || field.platform || '';
                const platformDef = getPlatformDefinition(platformName);
                const urlValue = watch(`socialLinks.${index}.url` as const) || field.url || '';

                return (
                  <div
                    key={field.id}
                    className="rounded-[12px] border border-slate-200 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                            urlValue ? 'border-[#B7D4F0] bg-blue-50 text-[#2563EB]' : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          {platformDef.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{platformName}</p>
                          <p className="truncate text-xs text-slate-500">{urlValue || 'Add a profile link'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#B7D4F0] hover:text-[#2563EB]"
                          onClick={() => handleLinkChange(index, { url: urlValue })}
                          title="Keep"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600"
                          onClick={() => remove(index)}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,170px)_minmax(0,1fr)]">
                      <div className="relative">
                        <select
                          id={`social-platform-select-${index}`}
                          {...register(`socialLinks.${index}.platform` as const, {
                            onChange: (event) => {
                              const nextPlatform = String(event.target.value || '');
                              const normalized = normalize(nextPlatform);
                              const duplicate = usedPlatforms.includes(normalized) && normalized !== normalize(platformName);
                              if (duplicate) {
                                event.target.value = platformName;
                                return;
                              }
                            },
                          })}
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          {[...DEFAULT_PLATFORMS, ...MORE_PLATFORM_OPTIONS].map((plat) => (
                            <option key={plat.name} value={plat.name}>
                              {plat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <input
                        type="text"
                        id={`social-url-input-${index}`}
                        placeholder={platformDef.placeholder}
                        {...register(`socialLinks.${index}.url` as const, {
                          validate: (val) => {
                            if (!val) return true;
                            if (!isValidUrl(val)) {
                              return 'Please enter a valid URL.';
                            }
                            return true;
                          },
                        })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 hover:bg-slate-50/30 focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    {errors.socialLinks?.[index]?.url ? (
                      <p className="mt-2 text-xs font-medium text-red-600">{errors.socialLinks[index]?.url?.message as string}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-slate-200 bg-slate-50/40 px-4 py-5 text-sm text-slate-500">
              No social profiles added yet. Use the cards above to start.
            </div>
          )}
        </>
      ) : null}

      {isMoreModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close add more platforms modal"
            onClick={() => setIsMoreModalOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-3xl rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[18px] font-semibold text-slate-900">Add More Platforms</h3>
                <p className="mt-1 text-sm text-slate-500">Choose from popular platforms or add a custom link.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search platform..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-10 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid max-h-[40vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
                {visibleMorePlatforms.map((platform) => {
                  const isSelected = usedPlatforms.includes(normalize(platform.name));
                  return (
                    <button
                      key={platform.name}
                      type="button"
                      onClick={() => addPlatform(platform)}
                      className={`rounded-[12px] border p-3 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#B7D4F0] bg-blue-50/40'
                          : 'border-slate-200 bg-white hover:border-[#B7D4F0] hover:bg-blue-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                          {platform.icon}
                        </div>
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected ? 'border-[#2563EB] bg-[#2563EB] text-white' : 'border-slate-200 bg-white text-slate-400'
                          }`}
                        >
                          {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-900">{platform.name}</p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  openCustomModal();
                }}
                className="w-full rounded-[14px] border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-[#B7D4F0] hover:bg-blue-50/30"
              >
                <p className="text-sm font-semibold text-slate-900">Add Custom Link</p>
                <p className="mt-1 text-xs text-slate-500">Add any other platform or custom URL.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {isCustomModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close custom link modal"
            onClick={() => setIsCustomModalOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-lg rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[18px] font-semibold text-slate-900">Add Custom Link</h3>
                <p className="mt-1 text-sm text-slate-500">Add any other platform or custom URL.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Platform Name</label>
                <input
                  type="text"
                  value={customPlatformName}
                  onChange={(event) => setCustomPlatformName(event.target.value)}
                  placeholder="e.g. Podcast, Newsletter, Booking"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Platform URL</label>
                <input
                  type="text"
                  value={customPlatformUrl}
                  onChange={(event) => setCustomPlatformUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Optional icon picker</p>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_ICON_CHOICES.map((choice) => (
                    <button
                      key={choice.key}
                      type="button"
                      onClick={() => setCustomIconKey(choice.key)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                        customIconKey === choice.key
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-[#B7D4F0]'
                      }`}
                    >
                      {choice.icon}
                    </button>
                  ))}
                </div>
              </div>

              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomLink}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
