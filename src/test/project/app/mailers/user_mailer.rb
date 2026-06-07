class UserMailer < ApplicationMailer
  def welcome
    mail(to: "user@example.com", subject: "Welcome")
  end

  def password_reset
    mail(to: "user@example.com", subject: "Reset your password")
  end
end
