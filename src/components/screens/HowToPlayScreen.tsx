import { useI18n } from '../../lib/i18n'
import { BackButton, Icon } from '../atoms'
import { MysticDivider } from '../items'
import { RoleCard } from '../items/RoleCard'

interface Props {
  onBack: () => void
}

/**
 * Simple parser to render **bold** text in translations.
 */
function parseBold(text: string) {
  const parts = text.split('**')
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className='font-semibold text-parchment-100'>
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

export function HowToPlayScreen({ onBack }: Props) {
  const { t } = useI18n()
  const hp = t.howToPlay

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toc = [
    { id: 'part1', label: hp.part1Title },
    { id: 'part2', label: hp.part2Title },
    { id: 'part3', label: hp.part3Title },
    { id: 'part4', label: hp.part4Title },
  ]

  return (
    <div className='relative flex min-h-app flex-col bg-grimoire-darker text-parchment-200 md:flex-row'>
      {/* Desktop ToC Sidebar */}
      <div className='sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-parchment-500/10 bg-black/20 p-6 md:block'>
        <div className='mb-8'>
          <BackButton onClick={onBack} label={t.common.back} />
        </div>
        <h2 className='mb-6 font-tarot text-xl tracking-widest text-mystic-gold uppercase'>{hp.title}</h2>
        <nav className='space-y-4'>
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className='block w-full text-left text-sm font-medium text-parchment-400 transition-colors hover:text-mystic-gold'
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className='mx-auto w-full max-w-3xl flex-1 space-y-16 px-4 py-6 sm:px-8 md:py-12 lg:max-w-4xl'>
        {/* Mobile Header */}
        <div className='sticky top-0 z-10 -mx-4 mb-8 flex items-center border-b border-parchment-500/10 bg-grimoire-darker/95 px-4 py-4 backdrop-blur-md md:hidden'>
          <BackButton onClick={onBack} label={t.common.back} />
          <h1 className='mr-8 flex-1 text-center font-tarot text-xl tracking-widest text-mystic-gold uppercase'>
            {hp.title}
          </h1>
        </div>

        {/* ================================================================ */}
        {/* PART 1: GAME RULES */}
        {/* ================================================================ */}
        <section id='part1' className='scroll-mt-24 space-y-8'>
          <h2 className='border-b border-mystic-gold/20 pb-4 font-tarot text-3xl tracking-widest text-mystic-gold uppercase'>
            {hp.part1Title}
          </h2>

          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-parchment-100'>{hp.p1_nutshellTitle}</h3>
            <ul className='list-disc space-y-2 pl-5 text-parchment-300'>
              <li>{parseBold(hp.p1_nutshell1)}</li>
              <li>{parseBold(hp.p1_nutshell2)}</li>
              <li>{parseBold(hp.p1_nutshell3)}</li>
              <li>{parseBold(hp.p1_nutshell4)}</li>
              <li>{parseBold(hp.p1_nutshell5)}</li>
            </ul>
          </div>

          <MysticDivider />

          <div className='space-y-6'>
            <h3 className='text-xl font-bold text-parchment-100'>{hp.p1_teamsTitle}</h3>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              {/* Townsfolk */}
              <div className='flex flex-col items-center space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 text-center shadow-lg sm:p-6'>
                <div className='space-y-3'>
                  <h4 className='font-tarot text-2xl tracking-widest text-mystic-gold uppercase'>
                    {t.teams.townsfolk.name}
                  </h4>
                  <p className='max-w-sm text-sm leading-relaxed text-parchment-200'>
                    {parseBold(hp.p1_teamTownsfolk)}
                  </p>
                </div>

                <div className='my-1 h-px w-full bg-white/10' />

                <div className='flex w-full flex-col items-center space-y-2'>
                  <p className='text-xs text-parchment-400 italic'>{parseBold(hp.p1_teamTownsfolkExample)}</p>
                  <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                    <RoleCard roleId='washerwoman' />
                  </div>
                </div>
              </div>

              {/* Outsider */}
              <div className='flex flex-col items-center space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 text-center shadow-lg sm:p-6'>
                <div className='space-y-3'>
                  <h4 className='font-tarot text-2xl tracking-widest text-mystic-gold uppercase'>
                    {t.teams.outsider.name}
                  </h4>
                  <p className='max-w-sm text-sm leading-relaxed text-parchment-200'>{parseBold(hp.p1_teamOutsider)}</p>
                </div>

                <div className='my-1 h-px w-full bg-white/10' />

                <div className='flex w-full flex-col items-center space-y-2'>
                  <p className='text-xs text-parchment-400 italic'>{parseBold(hp.p1_teamOutsiderExample)}</p>
                  <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                    <RoleCard roleId='drunk' />
                  </div>
                </div>
              </div>

              {/* Minion */}
              <div className='flex flex-col items-center space-y-4 rounded-xl border border-red-500/20 bg-red-900/10 p-5 text-center shadow-lg sm:p-6'>
                <div className='space-y-3'>
                  <h4 className='font-tarot text-2xl tracking-widest text-red-400 uppercase'>{t.teams.minion.name}</h4>
                  <p className='max-w-sm text-sm leading-relaxed text-parchment-200'>{parseBold(hp.p1_teamMinion)}</p>
                </div>

                <div className='my-1 h-px w-full bg-red-500/10' />

                <div className='flex w-full flex-col items-center space-y-2'>
                  <p className='text-xs text-red-300 italic'>{parseBold(hp.p1_teamMinionExample)}</p>
                  <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                    <RoleCard roleId='poisoner' />
                  </div>
                </div>
              </div>

              {/* Demon */}
              <div className='flex flex-col items-center space-y-4 rounded-xl border border-red-500/20 bg-red-900/10 p-5 text-center shadow-lg sm:p-6'>
                <div className='space-y-3'>
                  <h4 className='font-tarot text-2xl tracking-widest text-red-400 uppercase'>{t.teams.demon.name}</h4>
                  <p className='max-w-sm text-sm leading-relaxed text-parchment-200'>{parseBold(hp.p1_teamDemon)}</p>
                </div>

                <div className='my-1 h-px w-full bg-red-500/10' />

                <div className='flex w-full flex-col items-center space-y-2'>
                  <p className='text-xs text-red-300 italic'>{parseBold(hp.p1_teamDemonExample)}</p>
                  <div className='w-full max-w-[260px] sm:max-w-[300px]'>
                    <RoleCard roleId='imp' />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <MysticDivider />

          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-parchment-100'>{hp.p1_roundTitle}</h3>
            <div className='space-y-6 rounded-xl bg-black/20 p-6'>
              <div className='flex items-start gap-4'>
                <div className='mt-1 rounded-full bg-indigo-900/50 p-2'>
                  <Icon name='moon' className='text-indigo-400' size='sm' />
                </div>
                <div>
                  <h4 className='mb-1 font-bold text-parchment-100'>{hp.p1_roundNightLabel}</h4>
                  <p className='text-sm leading-relaxed text-parchment-300'>{hp.p1_roundNight}</p>
                </div>
              </div>
              <div className='flex items-start gap-4'>
                <div className='mt-1 rounded-full bg-amber-900/50 p-2'>
                  <Icon name='sun' className='text-mystic-gold' size='sm' />
                </div>
                <div>
                  <h4 className='mb-1 font-bold text-parchment-100'>{hp.p1_roundDayLabel}</h4>
                  <p className='text-sm leading-relaxed text-parchment-300'>{hp.p1_roundDay}</p>
                </div>
              </div>
              <div className='flex items-start gap-4'>
                <div className='mt-1 rounded-full bg-emerald-900/50 p-2'>
                  <Icon name='vote' className='text-emerald-400' size='sm' />
                </div>
                <div>
                  <h4 className='mb-1 font-bold text-parchment-100'>{hp.p1_roundNominateLabel}</h4>
                  <p className='text-sm leading-relaxed text-parchment-300'>{hp.p1_roundNominate}</p>
                </div>
              </div>
            </div>
            <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
              <h4 className='mb-2 text-xs font-bold tracking-wider text-parchment-100 uppercase'>
                {hp.p1_roundWinConditions}
              </h4>
              <ul className='space-y-2 text-sm text-parchment-300'>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-400'>•</span>
                  <span>{parseBold(hp.p1_roundWinGood)}</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-red-400'>•</span>
                  <span>{parseBold(hp.p1_roundWinEvil)}</span>
                </li>
              </ul>
            </div>
          </div>

          <MysticDivider />

          <div className='space-y-4'>
            <h3 className='text-xl font-bold text-parchment-100'>{hp.p1_conceptsTitle}</h3>
            <ul className='list-disc space-y-3 pl-5 text-sm leading-relaxed text-parchment-300'>
              <li>{parseBold(hp.p1_conceptPoison)}</li>
              <li>{parseBold(hp.p1_conceptDrunk)}</li>
              <li>{parseBold(hp.p1_conceptDead)}</li>
              <li>{parseBold(hp.p1_conceptStoryteller)}</li>
            </ul>
          </div>
        </section>

        {/* ================================================================ */}
        {/* PART 2: APP WALKTHROUGH */}
        {/* ================================================================ */}
        <section id='part2' className='scroll-mt-24 space-y-8'>
          <h2 className='border-b border-mystic-gold/20 pb-4 font-tarot text-3xl tracking-widest text-mystic-gold uppercase'>
            {hp.part2Title}
          </h2>

          <div className='space-y-8'>
            {/* Create Game */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-mystic-gold'>
                <Icon name='users' />
                <h3 className='text-xl font-bold'>{hp.p2_createTitle}</h3>
              </div>
              <ul className='list-disc space-y-2 pl-11 text-parchment-300'>
                <li>{parseBold(hp.p2_create1)}</li>
                <li>{parseBold(hp.p2_create2)}</li>
                <li>{parseBold(hp.p2_create3)}</li>
                <li>{parseBold(hp.p2_create4)}</li>
              </ul>
              <div className='ml-11 text-sm text-parchment-400/80 italic'>💡 {hp.p2_createTip}</div>
            </div>

            {/* Setup Actions */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-mystic-gold'>
                <Icon name='settings' />
                <h3 className='text-xl font-bold'>{hp.p2_setupTitle}</h3>
              </div>
              <ul className='list-disc space-y-2 pl-11 text-parchment-300'>
                <li>{parseBold(hp.p2_setup1)}</li>
                <li>{parseBold(hp.p2_setup2)}</li>
              </ul>
            </div>

            {/* Revelation */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-mystic-gold'>
                <Icon name='eye' />
                <h3 className='text-xl font-bold'>{hp.p2_revealTitle}</h3>
              </div>
              <ul className='list-disc space-y-2 pl-11 text-parchment-300'>
                <li>{parseBold(hp.p2_reveal1)}</li>
                <li>{parseBold(hp.p2_reveal2)}</li>
                <li>{parseBold(hp.p2_reveal3)}</li>
              </ul>
              <div className='mt-3 ml-11 rounded-lg border border-red-500/30 bg-red-900/20 p-3 text-sm text-red-200'>
                ⚠️ {parseBold(hp.p2_revealWarning)}
              </div>
            </div>

            {/* Night Component Visual */}
            <MysticDivider />

            {/* Night */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-indigo-400'>
                <Icon name='moon' />
                <h3 className='text-xl font-bold text-parchment-100'>{hp.p2_nightTitle}</h3>
              </div>
              <ul className='list-disc space-y-2 pl-11 text-parchment-300'>
                <li>{parseBold(hp.p2_night1)}</li>
                <li>{parseBold(hp.p2_night2)}</li>
                <li>{parseBold(hp.p2_night3)}</li>
                <li>{parseBold(hp.p2_night4)}</li>
                <li>{parseBold(hp.p2_night5)}</li>
              </ul>
              <div className='ml-11 text-sm text-parchment-400/80 italic'>💡 {parseBold(hp.p2_nightTip)}</div>
            </div>

            {/* Day */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-amber-500'>
                <Icon name='sun' />
                <h3 className='text-xl font-bold text-parchment-100'>{hp.p2_dayTitle}</h3>
              </div>
              <ul className='list-disc space-y-2 pl-11 text-parchment-300'>
                <li>{parseBold(hp.p2_day1)}</li>
                <li>{parseBold(hp.p2_day2)}</li>
                <li>{parseBold(hp.p2_day3)}</li>
                <li>{parseBold(hp.p2_day4)}</li>
              </ul>
            </div>

            {/* Voting */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-emerald-500'>
                <Icon name='vote' />
                <h3 className='text-xl font-bold text-parchment-100'>{hp.p2_voteTitle}</h3>
              </div>
              <ul className='list-disc space-y-2 pl-11 text-parchment-300'>
                <li>{parseBold(hp.p2_vote1)}</li>
                <li>{parseBold(hp.p2_vote2)}</li>
                <li>{parseBold(hp.p2_vote3)}</li>
                <li>{parseBold(hp.p2_vote4)}</li>
              </ul>
            </div>

            {/* End */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3 text-mystic-gold'>
                <Icon name='trophy' />
                <h3 className='text-xl font-bold'>{hp.p2_endTitle}</h3>
              </div>
              <ul className='list-disc space-y-2 pl-11 text-parchment-300'>
                <li>{parseBold(hp.p2_end1)}</li>
                <li>{parseBold(hp.p2_end2)}</li>
                <li className='text-blue-300'>{parseBold(hp.p2_end3)}</li>
                <li className='text-red-300'>{parseBold(hp.p2_end4)}</li>
                <li>{parseBold(hp.p2_end5)}</li>
              </ul>
            </div>

            <MysticDivider />

            {/* Grimoire & History */}
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <div className='space-y-3 rounded-xl border border-white/10 bg-white/5 p-5'>
                <div className='flex items-center gap-2 text-mystic-gold'>
                  <Icon name='bookMarked' size='sm' />
                  <h4 className='font-bold'>{hp.p2_grimTitle}</h4>
                </div>
                <ul className='list-disc space-y-2 pl-5 text-sm text-parchment-300'>
                  <li>{parseBold(hp.p2_grim1)}</li>
                  <li>{parseBold(hp.p2_grim2)}</li>
                  <li>{parseBold(hp.p2_grim3)}</li>
                </ul>
              </div>

              <div className='space-y-3 rounded-xl border border-white/10 bg-white/5 p-5'>
                <div className='flex items-center gap-2 text-mystic-gold'>
                  <Icon name='history' size='sm' />
                  <h4 className='font-bold'>{hp.p2_historyTitle}</h4>
                </div>
                <ul className='list-disc space-y-2 pl-5 text-sm text-parchment-300'>
                  <li>{parseBold(hp.p2_history1)}</li>
                  <li>{parseBold(hp.p2_history2)}</li>
                  <li>{parseBold(hp.p2_history3)}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* PART 3: TIPS FOR PLAYERS */}
        {/* ================================================================ */}
        <section id='part3' className='scroll-mt-24 space-y-8'>
          <h2 className='border-b border-mystic-gold/20 pb-4 font-tarot text-3xl tracking-widest text-mystic-gold uppercase'>
            {hp.part3Title}
          </h2>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'>
            <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
              <h4 className='mb-2 flex items-center gap-2 font-bold text-parchment-100'>
                <span className='text-mystic-gold'>1.</span>
                {hp.p3_tip1Title}
              </h4>
              <p className='text-sm leading-relaxed text-parchment-300'>{parseBold(hp.p3_tip1Desc)}</p>
            </div>
            <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
              <h4 className='mb-2 flex items-center gap-2 font-bold text-parchment-100'>
                <span className='text-mystic-gold'>2.</span>
                {hp.p3_tip2Title}
              </h4>
              <p className='text-sm leading-relaxed text-parchment-300'>{parseBold(hp.p3_tip2Desc)}</p>
            </div>
            <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
              <h4 className='mb-2 flex items-center gap-2 font-bold text-parchment-100'>
                <span className='text-mystic-gold'>3.</span>
                {hp.p3_tip3Title}
              </h4>
              <p className='text-sm leading-relaxed text-parchment-300'>{parseBold(hp.p3_tip3Desc)}</p>
            </div>
            <div className='rounded-xl border border-white/10 bg-white/5 p-5'>
              <h4 className='mb-2 flex items-center gap-2 font-bold text-parchment-100'>
                <span className='text-mystic-gold'>4.</span>
                {hp.p3_tip4Title}
              </h4>
              <p className='text-sm leading-relaxed text-parchment-300'>{parseBold(hp.p3_tip4Desc)}</p>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* PART 4: TIPS FOR STORYTELLERS */}
        {/* ================================================================ */}
        <section id='part4' className='scroll-mt-24 space-y-8 pb-16'>
          <h2 className='border-b border-mystic-gold/20 pb-4 font-tarot text-3xl tracking-widest text-mystic-gold uppercase'>
            {hp.part4Title}
          </h2>

          <div className='space-y-6'>
            <div>
              <h3 className='mb-3 flex items-center gap-2 text-xl font-bold text-parchment-100'>{hp.p4_firstTitle}</h3>
              <ul className='list-disc space-y-2 pl-5 text-parchment-300'>
                <li>{parseBold(hp.p4_first1)}</li>
                <li>{parseBold(hp.p4_first2)}</li>
                <li>{parseBold(hp.p4_first3)}</li>
                <li>{parseBold(hp.p4_first4)}</li>
              </ul>
            </div>

            <div>
              <h3 className='mb-3 flex items-center gap-2 text-xl font-bold text-parchment-100'>{hp.p4_duringTitle}</h3>
              <ul className='list-disc space-y-2 pl-5 text-parchment-300'>
                <li>{parseBold(hp.p4_during1)}</li>
                <li>{parseBold(hp.p4_during2)}</li>
                <li>{parseBold(hp.p4_during3)}</li>
                <li>{parseBold(hp.p4_during4)}</li>
              </ul>
            </div>

            <div>
              <h3 className='mb-3 flex items-center gap-2 text-xl font-bold text-parchment-100'>
                {hp.p4_pitfallsTitle}
              </h3>
              <ul className='space-y-2 text-parchment-300'>
                <li>{parseBold(hp.p4_pitfalls1)}</li>
                <li>{parseBold(hp.p4_pitfalls2)}</li>
                <li>{parseBold(hp.p4_pitfalls3)}</li>
                <li>{parseBold(hp.p4_pitfalls4)}</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
