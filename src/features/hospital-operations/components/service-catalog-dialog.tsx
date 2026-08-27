"use client"

import {
  useState,
  useTransition,
  type FormEvent,
} from "react"
import {
  LoaderCircle,
  Save,
  Stethoscope,
} from "lucide-react"
import {
  useRouter,
} from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  upsertServiceCatalogItemAction,
} from "@/features/hospital-operations/actions/service-catalog.actions"
import {
  serviceCatalogFormSchema,
  type ServiceCatalogFormValues,
} from "@/features/hospital-operations/schemas/service-catalog.schema"
import {
  HOSPITAL_SERVICE_TYPES,
  type ServiceCatalogBranch,
  type ServiceCatalogDepartment,
  type ServiceCatalogItem,
} from "@/features/hospital-operations/types/service-catalog.types"
import {
  formatCentavosAsPhpInput,
  SERVICE_TYPE_LABELS,
} from "@/features/hospital-operations/utils/service-catalog.utils"

interface ServiceCatalogDialogProps {
  open: boolean
  onOpenChange: (
    open: boolean
  ) => void
  item: ServiceCatalogItem | null
  departments:
    readonly ServiceCatalogDepartment[]
  branches:
    readonly ServiceCatalogBranch[]
}

function getInitialValues({
  item,
  departments,
}: {
  item: ServiceCatalogItem | null
  departments:
    readonly ServiceCatalogDepartment[]
}): ServiceCatalogFormValues {
  return {
    catalogItemId:
      item?.id ?? null,
    code: item?.code ?? "",
    name: item?.name ?? "",
    description:
      item?.description ?? "",
    serviceType:
      item?.serviceType ??
      "consultation",
    departmentCode:
      item?.departmentCode ??
      departments.find(
        (department) =>
          department.active
      )?.code ??
      "",
    branchId:
      item?.branchId ?? "",
    defaultPricePhp:
      item
        ? formatCentavosAsPhpInput(
            item.defaultPriceCentavos
          )
        : "0.00",
    doctorOrderRequired:
      item?.doctorOrderRequired ??
      false,
    allowsPatientRequest:
      item?.allowsPatientRequest ??
      false,
    active: item?.active ?? true,
  }
}

export function ServiceCatalogDialog({
  open,
  onOpenChange,
  item,
  departments,
  branches,
}: ServiceCatalogDialogProps) {
  const router = useRouter()

  const [
    values,
    setValues,
  ] = useState<ServiceCatalogFormValues>(
    () =>
      getInitialValues({
        item,
        departments,
      })
  )

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  )

  const [
    isPending,
    startTransition,
  ] = useTransition()

  function updateValue<
    Key extends keyof ServiceCatalogFormValues,
  >(
    key: Key,
    value:
      ServiceCatalogFormValues[Key]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }))
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setErrorMessage(null)

    const parsedValues =
      serviceCatalogFormSchema.safeParse(
        values
      )

    if (!parsedValues.success) {
      setErrorMessage(
        parsedValues.error.issues[0]
          ?.message ??
          "The service details are invalid."
      )

      return
    }

    startTransition(() => {
      void (async () => {
        const result =
          await upsertServiceCatalogItemAction(
            parsedValues.data
          )

        if (!result.success) {
          setErrorMessage(
            result.message
          )
          return
        }

        toast.success(
          result.message
        )

        onOpenChange(false)
        router.refresh()
      })()
    })
  }

  const activeDepartments =
    departments.filter(
      (department) =>
        department.active ||
        department.code ===
          values.departmentCode
    )

  const activeBranches =
    branches.filter(
      (branch) =>
        branch.active ||
        branch.id ===
          values.branchId
    )

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Stethoscope
              className="size-5"
              aria-hidden="true"
            />
          </div>

          <DialogTitle>
            {item
              ? "Edit hospital service"
              : "Create hospital service"}
          </DialogTitle>

          <DialogDescription>
            Configure an approved hospital
            service, its responsible
            department, branch scope, and
            default charge.
          </DialogDescription>
        </DialogHeader>

        <form
          id="service-catalog-form"
          noValidate
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-code">
                Service code
              </Label>

              <Input
                id="service-code"
                value={values.code}
                disabled={isPending}
                placeholder="CONSULT-GP"
                onChange={(event) =>
                  updateValue(
                    "code",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-name">
                Service name
              </Label>

              <Input
                id="service-name"
                value={values.name}
                disabled={isPending}
                placeholder="General consultation"
                onChange={(event) =>
                  updateValue(
                    "name",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-type">
                Service type
              </Label>

              <select
                id="service-type"
                value={values.serviceType}
                disabled={isPending}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) =>
                  updateValue(
                    "serviceType",
                    event.target.value as
                      ServiceCatalogFormValues["serviceType"]
                  )
                }
              >
                {HOSPITAL_SERVICE_TYPES.map(
                  (serviceType) => (
                    <option
                      key={serviceType}
                      value={serviceType}
                    >
                      {
                        SERVICE_TYPE_LABELS[
                          serviceType
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-department">
                Responsible department
              </Label>

              <select
                id="service-department"
                value={
                  values.departmentCode
                }
                disabled={isPending}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) =>
                  updateValue(
                    "departmentCode",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select department
                </option>

                {activeDepartments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.code}
                    >
                      {department.name}
                      {department.active
                        ? ""
                        : " — Inactive"}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-branch">
                Branch scope
              </Label>

              <select
                id="service-branch"
                value={values.branchId}
                disabled={isPending}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                onChange={(event) =>
                  updateValue(
                    "branchId",
                    event.target.value
                  )
                }
              >
                <option value="">
                  All active branches
                </option>

                {activeBranches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                      {branch.active
                        ? ""
                        : " — Inactive"}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-price">
                Default price in PHP
              </Label>

              <Input
                id="service-price"
                inputMode="decimal"
                value={
                  values.defaultPricePhp
                }
                disabled={isPending}
                placeholder="0.00"
                onChange={(event) =>
                  updateValue(
                    "defaultPricePhp",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="service-description">
                Description
                <span className="ml-1 font-normal text-muted-foreground">
                  Optional
                </span>
              </Label>

              <Textarea
                id="service-description"
                rows={4}
                value={values.description}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "description",
                    event.target.value
                  )
                }
              />
            </div>
          </section>

          <section className="grid gap-3 border-t pt-5 sm:grid-cols-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-teal-700"
                checked={
                  values.doctorOrderRequired
                }
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "doctorOrderRequired",
                    event.target.checked
                  )
                }
              />

              <span>
                <span className="block text-sm font-medium">
                  Doctor order required
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Reception cannot create the
                  request without a doctor-order
                  reference.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-teal-700"
                checked={
                  values.allowsPatientRequest
                }
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "allowsPatientRequest",
                    event.target.checked
                  )
                }
              />

              <span>
                <span className="block text-sm font-medium">
                  Patient may request
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  The service may later appear
                  in a patient-facing request
                  catalog.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-teal-700"
                checked={values.active}
                disabled={isPending}
                onChange={(event) =>
                  updateValue(
                    "active",
                    event.target.checked
                  )
                }
              />

              <span>
                <span className="block text-sm font-medium">
                  Active service
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Inactive services cannot be
                  selected for new patient
                  requests.
                </span>
              </span>
            </label>
          </section>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {errorMessage}
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="service-catalog-form"
            disabled={isPending}
            className="bg-teal-700 text-white hover:bg-teal-800"
          >
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                />
                Saving service
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                />
                Save service
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
