import eveningTeaImage from '../../assets/program/evening-tea.png'
import instructorMark from '../../assets/program/instructor-mark.svg'
import morningSilenceHero from '../../assets/program/morning-silence-hero.png'
import morningSilenceImage from '../../assets/program/morning-silence.png'
import oceanBreathingImage from '../../assets/program/ocean-breathing.png'
import slowWalkingImage from '../../assets/program/slow-walking.png'
import type { ProgramResponse } from './types'

export type ProgramCategory = 'ALL' | 'MEDITATION' | 'BREATH' | 'MOVEMENT'

export type ProgramPresentation = {
  category: Exclude<ProgramCategory, 'ALL'>
  level: string
  time: string
  duration: string
  location: string
  description: string
  availabilityDay: string
  image: string
  heroImage: string
  aboutTitle: string
  aboutBody: string
}

const presentations: Record<string, ProgramPresentation> = {
  'morning silence meditation': {
    category: 'MEDITATION',
    level: 'BEGINNER',
    time: '07:30',
    duration: '45 MIN',
    location: 'MEDITATION ROOM',
    description: '호흡과 바디스캔으로 고요한 하루를 여는 아침 명상입니다.',
    availabilityDay: 'TODAY',
    image: morningSilenceImage,
    heroImage: morningSilenceHero,
    aboutTitle: 'Return to the rhythm of your breath.',
    aboutBody:
      '아침의 빛과 고요 속에서 호흡의 감각을 알아차리고, 머리부터 발끝까지 몸의 상태를 천천히 살핍니다. 명상 경험이 없어도 강사의 안내에 따라 편안하게 참여할 수 있습니다. 결과를 만들기보다 지금 이 순간의 나를 있는 그대로 바라보는 연습입니다.',
  },
  'ocean breathing': {
    category: 'BREATH',
    level: 'ALL LEVELS',
    time: '17:30',
    duration: '35 MIN',
    location: 'SEA TERRACE',
    description: '파도의 리듬에 맞춰 긴장을 내려놓는 호흡 수련입니다.',
    availabilityDay: 'TODAY',
    image: oceanBreathingImage,
    heroImage: oceanBreathingImage,
    aboutTitle: 'Breathe with the rhythm of the sea.',
    aboutBody:
      '파도의 오고 감에 호흡을 맞추며 몸에 남아 있는 긴장을 부드럽게 내려놓습니다. 누구나 자신의 속도에 맞춰 참여할 수 있는 편안한 호흡 수련입니다.',
  },
  'slow walking practice': {
    category: 'MOVEMENT',
    level: 'BEGINNER',
    time: '10:00',
    duration: '60 MIN',
    location: 'PINE GARDEN',
    description: '소나무 정원을 천천히 걸으며 감각을 깨우는 움직임 명상입니다.',
    availabilityDay: 'TOMORROW',
    image: slowWalkingImage,
    heroImage: slowWalkingImage,
    aboutTitle: 'Let every step bring you back.',
    aboutBody:
      '발바닥에 닿는 감각과 자연의 소리에 주의를 기울이며 천천히 걷습니다. 특별한 경험 없이도 자신의 속도로 참여할 수 있는 움직임 명상입니다.',
  },
  'evening tea meditation': {
    category: 'MEDITATION',
    level: 'ALL LEVELS',
    time: '20:00',
    duration: '40 MIN',
    location: 'QUIET LOUNGE',
    description: '따뜻한 차의 온도와 향에 집중하며 하루를 마무리합니다.',
    availabilityDay: 'TOMORROW',
    image: eveningTeaImage,
    heroImage: eveningTeaImage,
    aboutTitle: 'Close the day with quiet attention.',
    aboutBody:
      '차의 온도와 향, 천천히 변하는 맛을 알아차리며 하루를 정돈합니다. 조용한 라운지에서 부담 없이 참여할 수 있는 저녁 명상입니다.',
  },
}

const fallbackImages = [morningSilenceImage, oceanBreathingImage, slowWalkingImage, eveningTeaImage]

export function getProgramPresentation(
  program: Pick<ProgramResponse, 'name'>,
  index = 0,
): ProgramPresentation {
  const matched = presentations[program.name.trim().toLowerCase()]
  if (matched) return matched

  const image = fallbackImages[index % fallbackImages.length]
  return {
    category: 'MEDITATION',
    level: 'ALL LEVELS',
    time: '10:00',
    duration: '45 MIN',
    location: 'MEDITATION ROOM',
    description: '숙박 중 편안하게 참여할 수 있는 마음챙김 프로그램입니다.',
    availabilityDay: 'TODAY',
    image,
    heroImage: program.name.toLowerCase().includes('morning') ? morningSilenceHero : image,
    aboutTitle: 'A quiet practice for your stay.',
    aboutBody:
      '호흡과 몸의 감각을 천천히 알아차리며 지금 이 순간에 머무는 연습입니다. 처음 참여하는 분도 안내에 따라 편안하게 함께할 수 있습니다.',
  }
}

export { instructorMark }
