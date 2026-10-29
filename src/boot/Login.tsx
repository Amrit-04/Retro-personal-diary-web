/**
 * The logon screen: a navy page with an inset blue field, the brand left of a
 * hairline divider and the account right of it — the layout of the mitchivin.com
 * reference, with our own marks in place of theirs.
 *
 * The tile is the sign-in: Google, with the popup flow falling back to a same-domain
 * redirect inside firebase/auth.ts. Failures stay here as a sentence with the
 * account still on screen, because the only thing this component calls is the machine.
 */
import { XpIcon } from '../shell/icons';
import { LogoMark } from '../shell/marks';
import { authError, restart, runtimeLive, session, signingIn, tapUserTile } from './machine';

export function Login() {
  const user = session.value;
  const busy = signingIn.value;
  const error = authError.value;

  const name = busy ? 'Signing in…' : user ? user.name : 'Sign in';
  const sub = busy
    ? 'Waiting for Google'
    : user
      ? 'Click to continue'
      : runtimeLive.value
        ? 'with your Google account'
        : 'into the sample diary';

  return (
    <div class="boot boot-login">
      <div class="login-inner">
        <div class="login-center">
          <div class="login-brand">
            <div class="login-logo">
              <LogoMark size={92} />
              <span class="splash-word login-word">
                Diary<sup>XP</sup>
              </span>
            </div>
            <p class="login-instruction">To begin, click the account to log in</p>
          </div>

          <span class="login-divider" aria-hidden="true" />

          <div class="login-right">
            <button class="login-tile" type="button" onClick={tapUserTile} disabled={busy}>
              {user?.photoURL ? (
                <img
                  class="login-photo"
                  src={user.photoURL}
                  alt=""
                  width={70}
                  height={70}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span class="login-photo">
                  <XpIcon name="user" size={56} />
                </span>
              )}
              <span class="login-text">
                <span class="login-name">{name}</span>
                <span class="login-sub">{sub}</span>
              </span>
            </button>

            {error ? (
              <p class="login-note" role="alert">
                {error}
              </p>
            ) : (
              !runtimeLive.value && (
                <p class="login-note login-note--info">
                  No Firebase project is configured, so the tile opens the built-in sample diary.
                </p>
              )
            )}
          </div>
        </div>
      </div>

      <button class="login-turnoff" type="button" onClick={restart}>
        <XpIcon name="restart" size={32} />
        <span>Restart</span>
      </button>

      <p class="login-detail">
        After you log on, the desktop is yours to explore.
        <br />
        Every entry is private to this diary.
      </p>
    </div>
  );
}
