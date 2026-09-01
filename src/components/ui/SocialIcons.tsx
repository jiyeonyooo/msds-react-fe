import instagram from '../../assets/ui/social-instagram.svg'
import kakaoTalk from '../../assets/ui/social-kakaotalk.svg'
import naverBlog from '../../assets/ui/social-naver-blog.svg'

const links = [{ label: 'Instagram', icon: instagram }, { label: 'KakaoTalk', icon: kakaoTalk }, { label: 'NAVER Blog', icon: naverBlog }]
export function SocialIcons() {
  return <div className="flex gap-2" aria-label="MSDS 소셜 미디어">{links.map(({ label, icon }) => <a aria-label={label} className="flex w-[82px] flex-col items-center gap-[7px] text-[9px] text-white/80" href="#social" key={label}><span className="grid size-[38px] place-items-center rounded-full border border-border-subtle"><img alt="" className="size-[19px]" src={icon} /></span>{label}</a>)}</div>
}
