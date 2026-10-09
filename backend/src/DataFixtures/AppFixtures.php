<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    private $userPasswordHasher;
    
    public function __construct(UserPasswordHasherInterface $userPasswordHasher)
    {
        $this->userPasswordHasher = $userPasswordHasher;
    }

    public function load(ObjectManager $manager): void
    {
        // Création d'un user "normal"
        $user = new User();
        $user->setEmail("user@gmail.com");
        $user->setUsernameField("user"); 
        $user->setRoles(["ROLE_USER"]);
        $user->setPassword($this->userPasswordHasher->hashPassword($user, "password"));
        $manager->persist($user);
        
        // Création d'un user admin
        $userAdmin = new User();
        $userAdmin->setEmail("admin@gmail.com");
        $userAdmin->setUsernameField("admin"); 
        $userAdmin->setRoles(["ROLE_ADMIN"]);
        $userAdmin->setPassword($this->userPasswordHasher->hashPassword($userAdmin, "password"));
        $manager->persist($userAdmin);

        // Création d'un user commercial
        $userCom = new User();
        $userCom->setEmail("com@gmail.com");
        $userCom->setUsernameField("commercial"); 
        $userCom->setRoles(["ROLE_COM"]);
        $userCom->setPassword($this->userPasswordHasher->hashPassword($userCom, "password"));
        $manager->persist($userCom);

        $manager->flush();
    }
}