import nodemailer, {type Transporter} from "nodemailer"

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
	if(transporterPromise) return transporterPromise;
// TODO(amaury): Mettre les variables d'env et les definir  
	transporterPromise = (async () => {
		if(process.env.SMTP_HOST) {
			return nodemailer.createTransport({
				host: process.env.SMTP_HOST,
				port: Number(process.env.SMTP_PORT ?? 587),
				secure: process.env.SMTP_SECURE == "true", 
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
			});
		}
//  // TODO(amaury): Supprimer cette partie - Correspond à un fake envoie pour tester
		const testAccount = await nodemailer.createTestAccount();
		console.log("Mail envoyé dans la théorie par Ethereal");
		return nodemailer.createTransport({
			host: testAccount.smtp.host,
			port: testAccount.smtp.port,
			secure: testAccount.smtp.secure,
			auth: {user: testAccount.user, pass: testAccount.pass},
		});
	}) ();
	return transporterPromise;
}



export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM ?? '"Judge" <no-reply@judge.local>',
    to,
    subject: "Réinitialisation de votre mot de passe",
    text:
      `Vous avez demandé à réinitialiser votre mot de passe.\n\n` +
      `Cliquez sur ce lien (valable 1 heure) :\n${resetUrl}\n\n` +
      `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Réinitialisation de votre mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block; background:#171717; color:#fff;
                    padding:10px 18px; border-radius:6px; text-decoration:none;">
            Choisir un nouveau mot de passe
          </a>
        </p>
        <p style="color:#666; font-size:14px;">
          Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette
          demande, ignorez cet email.
        </p>
      </div>`,
  });

  // En dev (Ethereal), nodemailer renvoie une URL pour visualiser le mail capturé
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📧 Aperçu du mail : ${previewUrl}`);
  }
}