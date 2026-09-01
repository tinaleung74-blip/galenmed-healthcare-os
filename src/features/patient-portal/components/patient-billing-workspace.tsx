import {
  CheckCircle2,
  CircleDollarSign,
  ReceiptText,
  WalletCards,
} from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  PatientPortalHeader,
} from "@/features/patient-portal/components/patient-portal-header"
import type {
  PatientPortalContext,
} from "@/features/patient-portal/types/patient-portal.types"
import type {
  PatientPortalBillingData,
} from "@/features/patient-portal/types/patient-portal-records.types"
import {
  formatPatientPortalMoney,
  formatPatientPortalRecordDateTime,
  formatPatientPortalStatus,
} from "@/features/patient-portal/utils/patient-portal-records.utils"

interface PatientBillingWorkspaceProps {
  context:
    PatientPortalContext

  data:
    PatientPortalBillingData
}

export function PatientBillingWorkspace({
  context,
  data,
}: PatientBillingWorkspaceProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <PatientPortalHeader />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold text-violet-700">
            Patient billing view
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Billing and Payment Status
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Read-only billing information
            for{" "}
            {
              context.patient
                .medicalRecordNumber
            }.
            Payment posting, refunds,
            and clearance remain
            Cashier-controlled.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <CircleDollarSign
                className="size-5 text-rose-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Outstanding balance
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {
                    formatPatientPortalMoney(
                      data.totalOutstandingCentavos
                    )
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <CheckCircle2
                className="size-5 text-emerald-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Total paid
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {
                    formatPatientPortalMoney(
                      data.totalPaidCentavos
                    )
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex items-start gap-3 p-5">
              <WalletCards
                className="size-5 text-violet-700"
                aria-hidden="true"
              />

              <div>
                <p className="text-xs text-muted-foreground">
                  Billing accounts
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {
                    data.accounts.length
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {data.accounts.length > 0 ? (
          <section className="space-y-4">
            {data.accounts.map(
              (account) => (
                <details
                  key={account.id}
                  className="rounded-xl border bg-white"
                >
                  <summary className="cursor-pointer list-none p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold">
                          {
                            account.billingNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Visit{" "}
                          {
                            account.visit
                              .visitNumber
                          }{" "}
                          ·{" "}
                          {
                            account.branch
                              .name
                          }{" "}
                          ·{" "}
                          {
                            formatPatientPortalRecordDateTime(
                              account.createdAt
                            )
                          }
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Gross
                          </p>

                          <p className="mt-1 font-semibold">
                            {
                              formatPatientPortalMoney(
                                account.grossAmountCentavos
                              )
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Paid
                          </p>

                          <p className="mt-1 font-semibold text-emerald-700">
                            {
                              formatPatientPortalMoney(
                                account.paidAmountCentavos
                              )
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Balance
                          </p>

                          <p className="mt-1 font-semibold text-rose-700">
                            {
                              formatPatientPortalMoney(
                                account.balanceAmountCentavos
                              )
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Status
                          </p>

                          <p className="mt-1 font-semibold">
                            {
                              formatPatientPortalStatus(
                                account.status
                              )
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="space-y-6 border-t p-5">
                    <section>
                      <h2 className="font-semibold">
                        Charges
                      </h2>

                      {account.charges.length >
                      0 ? (
                        <div className="mt-3 overflow-x-auto rounded-xl border">
                          <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3">
                                  Service
                                </th>
                                <th className="px-4 py-3">
                                  Quantity
                                </th>
                                <th className="px-4 py-3">
                                  Unit amount
                                </th>
                                <th className="px-4 py-3">
                                  Total
                                </th>
                                <th className="px-4 py-3">
                                  Status
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y">
                              {account.charges.map(
                                (charge) => (
                                  <tr
                                    key={
                                      charge.id
                                    }
                                  >
                                    <td className="px-4 py-3">
                                      <p className="font-semibold">
                                        {
                                          charge.serviceName ??
                                          charge.description
                                        }
                                      </p>

                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {
                                          charge.serviceRequestNumber ??
                                          charge.description
                                        }
                                      </p>
                                    </td>

                                    <td className="px-4 py-3">
                                      {
                                        charge.quantity
                                      }
                                    </td>

                                    <td className="px-4 py-3">
                                      {
                                        formatPatientPortalMoney(
                                          charge.unitAmountCentavos
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 font-semibold">
                                      {
                                        formatPatientPortalMoney(
                                          charge.totalAmountCentavos
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3">
                                      {
                                        formatPatientPortalStatus(
                                          charge.status
                                        )
                                      }
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No posted charge
                          items.
                        </p>
                      )}
                    </section>

                    <section>
                      <h2 className="font-semibold">
                        Payments and receipts
                      </h2>

                      {account.payments.length >
                      0 ? (
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          {account.payments.map(
                            (payment) => (
                              <div
                                key={
                                  payment.id
                                }
                                className="rounded-xl border p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <ReceiptText
                                    className="mt-0.5 size-5 text-violet-700"
                                    aria-hidden="true"
                                  />

                                  <div>
                                    <p className="font-mono text-sm font-semibold">
                                      {
                                        payment.paymentNumber
                                      }
                                    </p>

                                    <p className="mt-1 text-lg font-semibold">
                                      {
                                        formatPatientPortalMoney(
                                          payment.amountCentavos
                                        )
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {
                                        formatPatientPortalStatus(
                                          payment.paymentMethod
                                        )
                                      }{" "}
                                      ·{" "}
                                      {
                                        formatPatientPortalRecordDateTime(
                                          payment.postedAt
                                        )
                                      }
                                    </p>

                                    <p className="mt-2 text-xs">
                                      Official receipt:{" "}
                                      <span className="font-mono font-semibold">
                                        {
                                          payment.officialReceiptNumber ??
                                          "Not issued"
                                        }
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No posted payments.
                        </p>
                      )}
                    </section>

                    <section>
                      <h2 className="font-semibold">
                        Service clearances
                      </h2>

                      {account.clearances.length >
                      0 ? (
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          {account.clearances.map(
                            (clearance) => (
                              <div
                                key={
                                  clearance.id
                                }
                                className="rounded-xl border p-4"
                              >
                                <p className="font-semibold">
                                  {
                                    clearance.serviceName ??
                                    clearance.serviceRequestNumber
                                  }
                                </p>

                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                  {
                                    clearance.serviceRequestNumber
                                  }
                                </p>

                                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                                  <span>
                                    {
                                      formatPatientPortalStatus(
                                        clearance.clearanceStatus
                                      )
                                    }
                                  </span>

                                  <span className="font-semibold">
                                    {
                                      formatPatientPortalMoney(
                                        clearance.clearedAmountCentavos
                                      )
                                    }{" "}
                                    /{" "}
                                    {
                                      formatPatientPortalMoney(
                                        clearance.requiredAmountCentavos
                                      )
                                    }
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No service-clearance
                          records.
                        </p>
                      )}
                    </section>
                  </div>
                </details>
              )
            )}
          </section>
        ) : (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <ReceiptText
                className="size-9 text-slate-400"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-semibold">
                No billing records yet
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Billing appears after a
                GalenMed visit and hospital
                service charge.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
