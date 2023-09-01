export default (params, data) => ({
  from: params.mail_from,
  to: params.mail_to,
  subject: params.subject,
  html: `
      <h3> Hello ${data.username} </h3>
      <p>Thank you for registering into our Application. Much Appreciated! Just one last step is laying ahead of you...</p>
      <p>To activate your account please follow this link: <a target="_" href="${process.env.API_URL}/auth/activate/${data.hash}">${process.env.API_URL}/activate</a></p>
      <p>Cheers</p>
      <p>Your Application Team</p>
    `,
});
