'use client'

import { useState } from 'react'
import { MembershipAddModal } from '@/components/membership-add-modal'
import { MembershipEditModal } from '@/components/membership-edit-modal'
import { PlansManageModal } from '@/components/plans-manage-modal'
import type { MembershipAdmin, MembershipPlan } from '@/lib/types'

export function PlansManageButton({ plans }: { plans: MembershipPlan[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        <i className="fa-solid fa-boxes-stacked" /> Plans
      </button>
      {open && <PlansManageModal plans={plans} onClose={() => setOpen(false)} />}
    </>
  )
}

export function MembershipAddButton({ plans }: { plans: MembershipPlan[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
        <i className="fa-solid fa-plus" /> Add holder
      </button>
      {open && <MembershipAddModal plans={plans} onClose={() => setOpen(false)} />}
    </>
  )
}

export function MembershipEditButton({
  membership,
  plans,
}: {
  membership: MembershipAdmin
  plans: MembershipPlan[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        Edit
      </button>
      {open && (
        <MembershipEditModal membership={membership} plans={plans} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
