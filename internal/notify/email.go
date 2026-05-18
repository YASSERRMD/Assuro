package notify

import (
	"bytes"
	"context"
	"fmt"
	"net/smtp"
	"text/template"
)

// EmailMessage represents an outgoing email.
type EmailMessage struct {
	To      []string
	Subject string
	Body    string
}

// EmailSender sends email messages.
type EmailSender interface {
	Send(ctx context.Context, msg EmailMessage) error
}

// SMTPConfig holds SMTP connection settings.
type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

// SMTPSender sends emails via SMTP.
type SMTPSender struct {
	cfg SMTPConfig
}

// NewSMTPSender creates an SMTPSender.
func NewSMTPSender(cfg SMTPConfig) *SMTPSender {
	return &SMTPSender{cfg: cfg}
}

// Send sends an email via SMTP.
func (s *SMTPSender) Send(_ context.Context, msg EmailMessage) error {
	addr := fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)
	auth := smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)

	var buf bytes.Buffer
	buf.WriteString("From: " + s.cfg.From + "\r\n")
	for _, to := range msg.To {
		buf.WriteString("To: " + to + "\r\n")
	}
	buf.WriteString("Subject: " + msg.Subject + "\r\n")
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/plain; charset=UTF-8\r\n\r\n")
	buf.WriteString(msg.Body)

	return smtp.SendMail(addr, auth, s.cfg.From, msg.To, buf.Bytes())
}

// NullSender discards all emails (used in dev / tests).
type NullSender struct{}

// Send is a no-op.
func (n *NullSender) Send(_ context.Context, _ EmailMessage) error { return nil }

var notifyTmpl = template.Must(template.New("notify").Parse(`{{.Title}}

{{.Body}}

{{- if .LinkURL}}

View: {{.LinkURL}}
{{- end}}
`))

// RenderBody renders a plain-text notification email body.
func RenderBody(title, body, linkURL string) (string, error) {
	var buf bytes.Buffer
	err := notifyTmpl.Execute(&buf, map[string]string{
		"Title":   title,
		"Body":    body,
		"LinkURL": linkURL,
	})
	return buf.String(), err
}
