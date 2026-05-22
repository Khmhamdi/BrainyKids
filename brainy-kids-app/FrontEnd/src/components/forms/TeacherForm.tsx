"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";

const schema = z.object({
  username: z
    .string()
    .min(3, {
      message: "le nom d'utilisateur doit contenir au moin 3 caractères!",
    })
    .max(20, {
      message: "le nom du'tilisateur ne doit pas dépasser 20 caractères!",
    }),
  email: z.string().email({ message: "Email invalide!" }),
  password: z
    .string()
    .min(8, { message: "le mot de passe doit contenir au moin 8 caractères!" }),

  firstName: z.string().min(1, { message: "le Nom est obligatoir!" }),
  lastName: z.string().min(1, { message: "le Prénom est obligatoir!" }),
  telephone: z.string().min(1, { message: "le Téléphone est obligatoir!" }),
  adresse: z.string().min(1, { message: "l'adresse est obligatoire!" }),
  groupeSanguin: z.string().optional(),
  birthday: z.date({ message: "la date de naissance est obligatoire!" }),
  sex: z.enum(["Enfant", "fille"], { message: "le sex est obligatoir!" }),
  img: z.instanceof(File, { message: "L'image est obligatoire!" }),
});

type Inputs = z.infer<typeof schema>;

const TeacherForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Créer un nouveau Enseignat</h1>
      <span className="text-xs text-gray-500 font-medium">
        Informations d'authentification
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-500 font-medium">
        Informations personnelle
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nom"
          name="firstName"
          defaultValue={data?.firstName}
          register={register}
          error={errors?.firstName}
        />
        <InputField
          label="Préom"
          name="lastName"
          defaultValue={data?.lastName}
          register={register}
          error={errors?.lastName}
        />
        <InputField
          label="Téléphone"
          name="telephone"
          defaultValue={data?.telephone}
          register={register}
          error={errors?.telephone}
        />
        <InputField
          label="Adresse"
          name="adresse"
          defaultValue={data?.adresse}
          register={register}
          error={errors?.adresse}
        />
        <InputField
          label="Groupe sanguin"
          name="groupeSanguin"
          defaultValue={data?.groupeSanguin}
          register={register}
          error={errors?.groupeSanguin}
        />
        <InputField
          label="Date de naissance"
          name="birthday"
          type="date"
          defaultValue={data?.birthday}
          register={register}
          error={errors?.birthday}
        />
      </div>

      <button className="bg-blue-500 text-white p-2 rounded-md">
        {" "}
        {type === "create" ? "Ajouter" : "Mêttre à jour"}{" "}
      </button>
    </form>
  );
};

export default TeacherForm;