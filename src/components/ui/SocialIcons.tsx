import instagram from '../../assets/ui/social-instagram.svg'
import kakaoTalk from '../../assets/ui/social-kakaotalk.svg'
import naverBlog from '../../assets/ui/social-naver-blog.svg'

const links = [
  { label: 'Instagram', icon: instagram, href: 'https://www.instagram.com/samsung.sds' },
  { label: 'Samsung SDS', icon: kakaoTalk, href: 'https://www.samsungsds.com/kr' },
  { label: 'NAVER Blog', icon: naverBlog, href: 'https://blog.naver.com/post6155' },
]

export function SocialIcons() {
  return (
    <div className="flex gap-2" aria-label="MSDS 소셜 미디어">
      {links.map(({ label, icon, href }) => (
        <a
          aria-label={`${label} 새 창으로 열기`}
          className="flex w-[82px] flex-col items-center gap-[7px] text-[9px] text-white/80"
          href={href}
          key={label}
          rel="noreferrer"
          target="_blank"
        >
          <span className="grid size-[38px] place-items-center rounded-full border border-border-subtle">
            <img alt="" className="size-[19px]" src={icon} />
          </span>
          <span>{label}</span>
        </a>
      ))}
    </div>
  )
}
