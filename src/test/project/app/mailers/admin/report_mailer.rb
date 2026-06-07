module Admin
  class ReportMailer < ApplicationMailer
    def daily_summary
      mail(to: "admin@example.com", subject: "Daily summary")
    end
  end
end
